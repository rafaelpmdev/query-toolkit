import { isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import { QueryableFields } from '../types';
import { ParameterizedQuery } from './core/clause';
import { SqlBuilderConfig } from './core/config';
import { SQL_BUILDER_CONSTANTS } from './core/constants';
import { FilterBuilder } from './core/filter-builder';
import { PrimitiveValueTypes } from './core/primitive-value';
import { DuplicateJoinError, MaxClausesExceededError } from './core/sql-builder-errors';
import { SQL_KEYWORDS } from './core/sql-keywords';

/** Internal representation of a SELECT column entry */
interface SelectEntry {
  /** The resolved column expression (after columnMapper is applied, or a raw expression) */
  expression: string;
  /** Optional alias for the column (AS <alias>) */
  alias?: string;
}

/** Internal representation of a JOIN clause */
interface JoinEntry {
  /** The full JOIN SQL fragment, e.g. "LEFT JOIN orders ON users.id = orders.user_id" */
  sql: string;
  /**
   * Canonical identifier to detect duplicate non-raw joins.
   * For raw joins this is undefined and duplicate detection is skipped.
   */
  tableKey?: string;
}

/** Telemetry event triggered when build() completes successfully */
export interface QueryBuildEvent {
  sql: string;
  params: Nullable<PrimitiveValueTypes>[];
  durationMs: number;
}

/** Callback function for query build telemetry/logging */
export type QueryBuildListener = (event: QueryBuildEvent) => void;

export class SqlBuilder<Table> extends FilterBuilder<Table> {
  private static readonly regexCache = new Map<number, RegExp>();

  private static getPlaceholderRegex(index: number): RegExp {
    let regex = SqlBuilder.regexCache.get(index);
    if (!regex) {
      regex = new RegExp(`\\$${index}(?=\\b|[^0-9])`, 'g');
      SqlBuilder.regexCache.set(index, regex);
    }
    return regex;
  }

  private order: string[] = [];
  private group: string[] = [];
  private joins: JoinEntry[] = [];
  private selects: SelectEntry[] = [];
  private limit: number = SQL_BUILDER_CONSTANTS.NO_LIMIT;
  private offset: number = SQL_BUILDER_CONSTANTS.NO_OFFSET;
  private listeners: QueryBuildListener[] = [];
  /**
   * True when this builder was created via SqlBuilder.count().
   * In that mode, SELECT expressions are intentionally ignored to preserve COUNT(*).
   */
  private isCountQuery: boolean = false;
  /**
   * Cached byte-offset of " FROM " in the base SQL string (upper-cased).
   * Computed once in the constructor so that resolveSelectClause() never allocates
   * a temporary uppercase string on every build() call.
   * Value is -1 when the base SQL has no FROM clause.
   */
  private readonly sqlFromIndex: number;
  /**
   * O(1) lookup set for joined table names (lower-cased).
   * Parallel to `joins` array — kept in sync by addJoin() / reset() / clone().
   */
  private joinedTables: Set<string> = new Set();

  /**
   * Creates a new SqlBuilder instance.
   * @param sql The base SQL query (e.g., "SELECT * FROM users").
   * @param columnMapper Optional mapping from domain field names to database column names.
   * @param config Optional configuration for safety limits (max clauses, max limit, etc.).
   */
  constructor(
    protected sql: string,
    columnMapper?: Partial<Record<keyof Table & string, string>>,
    config?: Partial<SqlBuilderConfig>
  ) {
    const resolvedConfig = {
      maxWhereClauses: config?.maxWhereClauses ?? SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES,
      maxOrderByClauses: config?.maxOrderByClauses ?? SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES,
      maxGroupByClauses: config?.maxGroupByClauses ?? SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES,
      maxLimit: config?.maxLimit ?? SQL_BUILDER_CONSTANTS.MAX_LIMIT,
      maxJoins: config?.maxJoins ?? SQL_BUILDER_CONSTANTS.MAX_JOINS,
      prettyPrint: config?.prettyPrint,
      enableSecurityWarnings: config?.enableSecurityWarnings,
    };
    super(columnMapper, resolvedConfig);
    this.sqlFromIndex = sql.toUpperCase().indexOf(' FROM ');
  }

  /**
   * Static factory method to start building a query from a table name.
   * Equivalent to `new SqlBuilder("SELECT * FROM ${table}")`.
   * @param table The name of the database table.
   * @param columnMapper Optional mapping from domain field names to database column names.
   * @param config Optional configuration for safety limits.
   */
  static from<T>(
    table: string,
    columnMapper?: Partial<Record<keyof T & string, string>>,
    config?: Partial<SqlBuilderConfig>
  ): SqlBuilder<T> {
    return new SqlBuilder<T>(`SELECT * FROM ${table}`, columnMapper, config);
  }

  static count<T>(
    table: string,
    columnMapper?: Partial<Record<keyof T & string, string>>,
    config?: Partial<SqlBuilderConfig>
  ): SqlBuilder<T> {
    const builder = new SqlBuilder<T>(
      `SELECT COUNT(*) as count FROM ${table}`,
      columnMapper,
      config
    );
    builder.isCountQuery = true;
    return builder;
  }

  // ─── Column Selection ─────────────────────────────────────────────────────

  /**
   * Selects specific columns from the table, applying columnMapper automatically.
   * If never called, the query defaults to SELECT *.
   * When called on a count() builder, the selection is silently ignored.
   *
   * @param fields One or more domain field names (mapped via columnMapper when applicable).
   */
  select(...fields: Array<QueryableFields<Table>>): this {
    for (const field of fields) {
      this.selects.push({ expression: this.column(field) });
    }
    return this;
  }

  /**
   * Adds a raw SQL expression to the SELECT clause (e.g. "COUNT(*) as total").
   * columnMapper is NOT applied — the caller is fully responsible for the expression.
   *
   * @param expression Raw SQL expression.
   * @param alias Optional alias for the expression (AS <alias>).
   */
  selectRaw(expression: string, alias?: string): this {
    this.checkSecurity(expression, []);
    this.selects.push({ expression, alias });
    return this;
  }

  /**
   * Selects a column with an explicit alias.
   * columnMapper is applied to the field, but the alias is used as-is.
   *
   * @param field Domain field name.
   * @param alias The SQL alias (AS <alias>).
   */
  selectAs(field: QueryableFields<Table>, alias: string): this {
    this.selects.push({ expression: this.column(field), alias });
    return this;
  }

  // ─── JOIN Clauses ─────────────────────────────────────────────────────────

  /**
   * Adds a structured JOIN clause. Duplicate table joins are rejected with a RangeError.
   * For cross-table ON conditions, fields are accepted as plain strings since the TypeScript
   * type system cannot infer cross-table column names without composite generics.
   *
   * Design decision: duplicates throw a RangeError (not silent ignore).
   * Rationale: silently ignoring a duplicate JOIN hides a likely application bug (e.g. a
   * repository method called twice). Failing loudly makes the defect immediately visible.
   *
   * @param type JOIN type keyword.
   * @param table The table to join.
   * @param leftColumn The left-hand column in the ON clause (e.g. "users.id").
   * @param rightColumn The right-hand column in the ON clause (e.g. "orders.user_id").
   */
  private addJoin(type: string, table: string, leftColumn: string, rightColumn: string): this {
    if (this.joins.length >= this.config.maxJoins) {
      throw new MaxClausesExceededError(`Maximum JOIN clauses exceeded: ${this.config.maxJoins}`);
    }
    const tableKey = table.trim().toLowerCase();
    if (this.joinedTables.has(tableKey)) {
      throw new DuplicateJoinError(`Duplicate JOIN detected for table: "${table}"`);
    }
    this.joinedTables.add(tableKey);
    this.joins.push({
      sql: `${type} ${table} ${SQL_KEYWORDS.ON} ${leftColumn} = ${rightColumn}`,
      tableKey,
    });
    return this;
  }

  /**
   * Adds an INNER JOIN clause.
   * @param table Table to join.
   * @param leftColumn Left-side ON column (e.g. "users.id").
   * @param rightColumn Right-side ON column (e.g. "orders.user_id").
   */
  join(table: string, leftColumn: string, rightColumn: string): this {
    return this.addJoin(SQL_KEYWORDS.JOIN, table, leftColumn, rightColumn);
  }

  /**
   * Adds a LEFT JOIN clause.
   * @param table Table to join.
   * @param leftColumn Left-side ON column.
   * @param rightColumn Right-side ON column.
   */
  leftJoin(table: string, leftColumn: string, rightColumn: string): this {
    return this.addJoin(SQL_KEYWORDS.LEFT_JOIN, table, leftColumn, rightColumn);
  }

  /**
   * Adds a RIGHT JOIN clause.
   * @param table Table to join.
   * @param leftColumn Left-side ON column.
   * @param rightColumn Right-side ON column.
   */
  rightJoin(table: string, leftColumn: string, rightColumn: string): this {
    return this.addJoin(SQL_KEYWORDS.RIGHT_JOIN, table, leftColumn, rightColumn);
  }

  /**
   * Adds a FULL OUTER JOIN clause.
   * @param table Table to join.
   * @param leftColumn Left-side ON column.
   * @param rightColumn Right-side ON column.
   */
  fullJoin(table: string, leftColumn: string, rightColumn: string): this {
    return this.addJoin(SQL_KEYWORDS.FULL_JOIN, table, leftColumn, rightColumn);
  }

  /**
   * Adds a raw JOIN expression without any validation or duplicate checking.
   * Use for complex join conditions that cannot be expressed via the structured API.
   *
   * @param rawJoin A complete JOIN SQL fragment (e.g. "INNER JOIN tags t ON t.id = ANY(users.tag_ids)").
   */
  joinRaw(rawJoin: string): this {
    if (this.joins.length >= this.config.maxJoins) {
      throw new MaxClausesExceededError(`Maximum JOIN clauses exceeded: ${this.config.maxJoins}`);
    }
    this.joins.push({ sql: rawJoin });
    return this;
  }

  /**
   * Adds ORDER BY clauses.
   * @param sort Sort direction ('asc' or 'desc').
   * @param value List of fields to sort by.
   */
  addOrder(sort: 'asc' | 'desc', ...value: Array<QueryableFields<Table>>): this {
    if (this.order.length + value.length > this.config.maxOrderByClauses) {
      throw new MaxClausesExceededError(
        `Maximum ORDER BY clauses exceeded: ${this.config.maxOrderByClauses}`
      );
    }
    const newOrders = value.map((element) => `${this.column(element)} ${sort}`);
    this.order.push(...newOrders);
    return this;
  }

  /**
   * Adds GROUP BY clauses.
   * @param value List of fields to group by.
   */
  addGroup(...value: Array<QueryableFields<Table>>): this {
    if (this.group.length + value.length > this.config.maxGroupByClauses) {
      throw new MaxClausesExceededError(
        `Maximum GROUP BY clauses exceeded: ${this.config.maxGroupByClauses}`
      );
    }
    const newGroups = value.map((element) => this.column(element));
    this.group.push(...newGroups);
    return this;
  }

  /**
   * Sets the LIMIT for the query.
   * @param limit Maximum number of records to return.
   */
  addLimit(limit: number | null | undefined): this {
    if (isNullOrUndefined(limit)) {
      this.limit = SQL_BUILDER_CONSTANTS.NO_LIMIT;
      return this;
    }

    if (!Number.isInteger(limit)) {
      throw new TypeError('Limit must be an integer');
    }
    if (limit < 0) {
      throw new RangeError('Limit must be non-negative');
    }
    if (limit > this.config.maxLimit) {
      throw new RangeError(`Limit exceeds maximum: ${this.config.maxLimit}`);
    }
    this.limit = limit;
    return this;
  }

  /**
   * Sets the OFFSET for the query.
   * @param offset Number of records to skip.
   */
  addOffset(offset: number | null | undefined): this {
    if (isNullOrUndefined(offset)) {
      this.offset = SQL_BUILDER_CONSTANTS.NO_OFFSET;
      return this;
    }

    if (!Number.isInteger(offset)) {
      throw new TypeError('Offset must be an integer');
    }
    if (offset < 0) {
      throw new RangeError('Offset must be non-negative');
    }
    this.offset = offset;
    return this;
  }

  /**
   * Resets all filters (where, order, group, joins, selects, limit, offset) back to the base query.
   */
  reset(): this {
    this.where = [];
    this.order = [];
    this.group = [];
    this.joins = [];
    this.joinedTables = new Set();
    this.selects = [];
    this.limit = SQL_BUILDER_CONSTANTS.NO_LIMIT;
    this.offset = SQL_BUILDER_CONSTANTS.NO_OFFSET;
    return this;
  }

  /**
   * Registers a listener that is invoked whenever build() completes successfully.
   * Useful for performance telemetry, logging, and integration with APMs.
   */
  onBuild(listener: QueryBuildListener): this {
    this.listeners.push(listener);
    return this;
  }

  /**
   * Alias semântico para build()
   */
  toSQL(): ParameterizedQuery {
    return this.build();
  }

  /**
   * Builds the SQL query with parameterized values (prepared statement format).
   * This is the recommended way to generate queries for execution against a database.
   *
   * SQL order: SELECT … FROM … JOINs … WHERE … GROUP BY … ORDER BY … LIMIT … OFFSET
   *
   * Uses an array of string parts joined at the end to avoid allocating intermediate
   * strings for each SQL clause.
   *
   * @returns An object containing the SQL string with placeholders ($1, $2, etc.) and the array of parameter values.
   */
  build(): ParameterizedQuery {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const parts: string[] = [this.resolveSelectClause()];
    const allParams: Nullable<PrimitiveValueTypes>[] = [];
    let paramIndex = 1;

    // JOINs — inserted immediately after FROM, before WHERE
    if (this.joins.length > 0) {
      parts.push(this.joins.map((j) => j.sql).join(' '));
    }

    if (this.where.length > 0) {
      const whereParts: string[] = [];

      for (const w of this.where) {
        const built = w.build({ startParamIndex: paramIndex });
        if (built && built.sql) {
          whereParts.push(`(${built.sql})`);
          allParams.push(...built.params);
          paramIndex += built.params.length;
        }
      }

      if (whereParts.length > 0) {
        parts.push(`${SQL_KEYWORDS.WHERE} ${whereParts.join(` ${SQL_KEYWORDS.AND} `)}`);
      }
    }

    if (this.group.length > 0) {
      parts.push(`${SQL_KEYWORDS.GROUP_BY} ${this.group.join(', ')}`);
    }

    if (this.order.length > 0) {
      parts.push(`${SQL_KEYWORDS.ORDER_BY} ${this.order.join(', ')}`);
    }

    if (this.limit > SQL_BUILDER_CONSTANTS.NO_LIMIT) {
      parts.push(`${SQL_KEYWORDS.LIMIT} ${this.limit}`);
    }

    if (this.offset > SQL_BUILDER_CONSTANTS.NO_OFFSET) {
      parts.push(`${SQL_KEYWORDS.OFFSET} ${this.offset}`);
    }

    const rawSql = parts.join(' ');
    const sql =
      this.config.prettyPrint !== false ? rawSql.replace(/\s+/g, ' ').trim() : rawSql.trim();

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = endTime - startTime;

    if (this.listeners.length > 0) {
      const event: QueryBuildEvent = { sql, params: allParams, durationMs };
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Error in SqlBuilder build listener:', e);
        }
      }
    }

    return {
      sql,
      params: allParams,
    };
  }

  /**
   * Resolves the SELECT clause from the base SQL, applying column selection when present.
   *
   * Rules:
   * - Count queries always keep their original COUNT(*) expression (isCountQuery flag).
   * - If no selects were registered → return the original sql unchanged (SELECT *).
   * - Otherwise → replace the SELECT portion with the resolved column list.
   *
   * Uses `this.sqlFromIndex` (cached in the constructor) to avoid allocating a new
   * uppercase string on every build() call.
   */
  private resolveSelectClause(): string {
    if (this.isCountQuery || this.selects.length === 0) {
      return this.sql;
    }

    const columns = this.selects
      .map((entry) => (entry.alias ? `${entry.expression} AS ${entry.alias}` : entry.expression))
      .join(', ');

    if (this.sqlFromIndex === -1) {
      // Fallback: base SQL has no FROM clause — prepend the resolved SELECT
      return `SELECT ${columns} ${this.sql}`;
    }

    return `SELECT ${columns}${this.sql.slice(this.sqlFromIndex)}`;
  }

  /**
   * Retorna a string SQL crua com os parâmetros interpolados e sanitizados (apenas para debug/logging).
   * Não deve ser utilizada para execução contra o banco devido a riscos de formatação sutil.
   *
   * @deprecated Use only for debugging/logging. Never execute the output against a database.
   */
  buildRaw(): string {
    const { sql, params } = this.build();
    let rawSql = sql;
    params.forEach((param, index) => {
      let formattedParam = 'NULL';
      if (param !== null && param !== undefined) {
        if (typeof param === 'string') {
          formattedParam = `'${param.replace(/'/g, "''")}'`;
        } else if (param instanceof Date) {
          formattedParam = `'${param.toISOString()}'`;
        } else if (Array.isArray(param)) {
          const arrayItems = param
            .map((p) => {
              if (typeof p === 'string') return `"${p.replace(/"/g, '\\"')}"`;
              return String(p);
            })
            .join(',');
          formattedParam = `'[${arrayItems}]'`;
        } else {
          formattedParam = String(param);
        }
      }
      rawSql = rawSql.replace(SqlBuilder.getPlaceholderRegex(index + 1), formattedParam);
    });
    return rawSql;
  }

  /**
   * Creates a deep clone of this SqlBuilder instance.
   * Useful for creating derived queries from a base query.
   * Joins, selects, where clauses, ordering and pagination are all copied.
   */
  clone(): this {
    const constructor = this.constructor as new (
      sql: string,
      columnMapper?: Partial<Record<string, string>>,
      config?: Partial<SqlBuilderConfig>
    ) => this;
    const cloned = new constructor(
      this.sql,
      this.columnMapper as Partial<Record<string, string>>,
      this.config
    );
    cloned.where = [...this.where];
    cloned.order = [...this.order];
    cloned.group = [...this.group];
    cloned.joins = [...this.joins];
    cloned.joinedTables = new Set(this.joinedTables);
    cloned.selects = [...this.selects];
    cloned.isCountQuery = this.isCountQuery;
    cloned.limit = this.limit;
    cloned.offset = this.offset;
    return cloned;
  }

  /**
   * Returns a human-readable string representation for debugging
   */
  toString(): string {
    return `SqlBuilder {
  base: "${this.sql}",
  selects: [${this.selects.length} columns],
  joins: [${this.joins.length} joins],
  where: [${this.where.length} clauses],
  order: [${this.order.map((o) => `"${o}"`).join(', ')}],
  group: [${this.group.map((g) => `"${g}"`).join(', ')}],
  limit: ${this.limit},
  offset: ${this.offset}
}`;
  }

  /**
   * Returns a JSON representation of the builder state.
   * build() is called exactly once and its result cached locally to avoid
   * duplicate work and to guarantee a consistent snapshot.
   */
  toJSON() {
    const built = this.build();
    return {
      base: this.sql,
      selects: this.selects.map((s) => (s.alias ? `${s.expression} AS ${s.alias}` : s.expression)),
      joins: this.joins.map((j) => j.sql),
      where: '...Serialized clauses not supported...',
      order: [...this.order],
      group: [...this.group],
      limit: this.limit,
      offset: this.offset,
      sql: built.sql,
    };
  }
}
