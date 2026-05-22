import { isEmpty, isNullOrUndefined, Nullable } from '@raicamposs/toolkit';
import { QueryableFields } from '../../types';
import { Clause, ParameterizedQuery } from '../core/clause';
import { SQL_BUILDER_CONSTANTS } from '../core/constants';
import { PrimitiveValueTypes } from '../core/primitive-value';
import { SQL_KEYWORDS } from '../core/sql-keywords';
import { TransformFunction } from '../core/transform-function';
import {
  BetweenParam,
  ClauseBetween,
  ClauseCondition,
  ClauseContains,
  ClauseEquals,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseLike,
  ClauseNotEquals,
  ClauseNotExists,
  ClauseOr,
  Condition,
} from '../implementations';
import { ClauseExists } from '../implementations/clause-exists';

export interface SqlBuilderConfig {
  maxWhereClauses: number;
  maxOrderByClauses: number;
  maxGroupByClauses: number;
  maxLimit: number;
}
// ... (rest of class) ...

export class SqlBuilder<Table> {
  private where: Array<string | Clause> = [];
  private order: ReadonlyArray<string> = [];
  private group: ReadonlyArray<string> = [];
  private limit: number = SQL_BUILDER_CONSTANTS.NO_LIMIT;
  private offset: number = SQL_BUILDER_CONSTANTS.NO_OFFSET;
  private readonly config: SqlBuilderConfig;

  /**
   * Creates a new SqlBuilder instance.
   * @param sql The base SQL query (e.g., "SELECT * FROM users").
   * @param columnMapper Optional mapping from domain field names to database column names.
   * @param config Optional configuration for safety limits (max clauses, max limit, etc.).
   */
  constructor(
    protected sql: string,
    private readonly columnMapper?: Record<string, string>,
    config?: Partial<SqlBuilderConfig>
  ) {
    this.config = {
      maxWhereClauses: config?.maxWhereClauses ?? SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES,
      maxOrderByClauses: config?.maxOrderByClauses ?? SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES,
      maxGroupByClauses: config?.maxGroupByClauses ?? SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES,
      maxLimit: config?.maxLimit ?? SQL_BUILDER_CONSTANTS.MAX_LIMIT,
    };
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
    columnMapper?: Record<string, string>,
    config?: Partial<SqlBuilderConfig>
  ): SqlBuilder<T> {
    return new SqlBuilder<T>(`SELECT * FROM ${table}`, columnMapper, config);
  }

  static count<T>(
    table: string,
    columnMapper?: Record<string, string>,
    config?: Partial<SqlBuilderConfig>
  ): SqlBuilder<T> {
    return new SqlBuilder<T>(`SELECT COUNT(*) as count FROM ${table}`, columnMapper, config);
  }

  private column(field: QueryableFields<Table>): string {
    const fieldStr = field.toString();
    if (this.columnMapper && this.columnMapper[fieldStr]) {
      return this.columnMapper[fieldStr];
    }
    return fieldStr;
  }

  /** Filter Elements - Add where clause filters */
  private andFilter(value: Clause) {
    if (this.where.length >= this.config.maxWhereClauses) {
      throw new RangeError(`Maximum WHERE clauses exceeded: ${this.config.maxWhereClauses}`);
    }
    const filter = value.build({ startParamIndex: 1 });
    if (filter && filter.sql) this.where = [...this.where, value];
    return this;
  }

  whereClause(clause: Clause) {
    return this.andFilter(clause);
  }

  whereClauses(clauses: Clause[]) {
    for (const clause of clauses) {
      this.whereClause(clause);
    }
    return this;
  }

  whereExists(sql: string) {
    return this.andFilter(new ClauseExists(sql));
  }

  whereNotExists(sql: string) {
    return this.andFilter(new ClauseNotExists(sql));
  }

  /**
   * Adds a WHERE IN clause.
   * @param field The field to filter on.
   * @param compareFields The array of values to check against.
   */
  whereIn(field: QueryableFields<Table>, compareFields: string[] | number[]) {
    return this.andFilter(new ClauseIn(this.column(field), compareFields));
  }

  /**
   * Adds a WHERE LIKE clause.
   * @param field The field to filter on.
   * @param value The pattern to match (e.g., "%value%").
   */
  whereLike(field: QueryableFields<Table>, value: string) {
    return this.andFilter(new ClauseLike(this.column(field), value));
  }

  /**
   * Adds a WHERE ILIKE clause (case-insensitive LIKE).
   * @param field The field to filter on.
   * @param value The pattern to match.
   */
  whereILike(field: QueryableFields<Table>, value: string) {
    return this.andFilter(new ClauseILike(this.column(field), value));
  }

  /**
   * Adds a WHERE BETWEEN clause.
   * @param field The field to filter on.
   * @param start The start value (inclusive).
   * @param end The end value (inclusive).
   */
  whereBetween(field: QueryableFields<Table>, start: BetweenParam, end: BetweenParam) {
    return this.andFilter(new ClauseBetween(this.column(field), start, end));
  }

  whereGreaterThan(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseGreaterThan(this.column(field), value));
  }

  whereGreaterThanOrEquals(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseGreaterThanOrEquals(this.column(field), value));
  }

  whereLessThan(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseLessThan(this.column(field), value));
  }

  whereLessThanOrEquals(field: QueryableFields<Table>, value: Date | number) {
    return this.andFilter(new ClauseLessThanOrEquals(this.column(field), value));
  }

  /**
   * Adds a WHERE BETWEEN clause using an object with gte/lte properties.
   */
  whereBetweenOperator(
    field: QueryableFields<Table>,
    operator: {
      gte: Date | number;
      lte: Date | number;
    }
  ) {
    return this.andFilter(new ClauseBetween(this.column(field), operator.gte, operator.lte));
  }

  /**
   * Adds a WHERE = clause.
   * @param field The field to filter on.
   * @param value The value to match.
   */
  whereEquals(field: QueryableFields<Table>, value: string | number | boolean) {
    return this.andFilter(new ClauseEquals(this.column(field), value));
  }

  /**
   * Adds a WHERE != clause.
   * @param field The field to filter on.
   * @param value The value to exclude.
   */
  whereNotEquals(field: QueryableFields<Table>, value: string | number | boolean) {
    return this.andFilter(new ClauseNotEquals(this.column(field), value));
  }

  /**
   * Filter by array containment operations
   * @param field - Field name
   * @param compareFields - Array of values to compare
   * @param containment - Containment operator: '@>' (contains) or '<@' (is contained by)
   */
  whereArrayContains(
    field: QueryableFields<Table>,
    compareFields: string[],
    containment?: '<@' | '@>'
  ) {
    return this.andFilter(new ClauseContains(this.column(field), compareFields, containment));
  }

  /**
   * Adds multiple conditions from an object.
   * @param values Object where keys are fields and values are conditions.
   * @param transform Optional function to transform values before building clauses.
   */
  whereConditions(
    values: Partial<Record<QueryableFields<Table>, Condition>>,
    transform?: TransformFunction
  ) {
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        this.whereCondition(key as QueryableFields<Table>, value as Condition, transform);
      }
    }
    return this;
  }

  /**
   * Adds a single complex condition.
   * @param field The field to filter on.
   * @param value The condition (e.g., { gt: 10, lte: 20 }).
   * @param transform Optional value transformer.
   */
  whereCondition(field: QueryableFields<Table>, value: Condition, transform?: TransformFunction) {
    return this.andFilter(new ClauseCondition(field.toString(), value, transform));
  }

  whereRaw(raw: string) {
    if (!isEmpty(raw)) this.where = [...this.where, raw];
    return this;
  }

  /**
   * Adds an OR clause containing multiple sub-clauses.
   * @param value List of clauses to join with OR.
   */
  orFilter(...value: Clause[]) {
    return this.andFilter(new ClauseOr(...value));
  }

  /**
   * Adds ORDER BY clauses.
   * @param sort Sort direction ('asc' or 'desc').
   * @param value List of fields to sort by.
   */
  addOrder(sort: 'asc' | 'desc', ...value: Array<QueryableFields<Table>>) {
    if (this.order.length + value.length > this.config.maxOrderByClauses) {
      throw new RangeError(`Maximum ORDER BY clauses exceeded: ${this.config.maxOrderByClauses}`);
    }
    const newOrders = value.map((element) => `${this.column(element)} ${sort}`);
    this.order = [...this.order, ...newOrders];
    return this;
  }

  /**
   * Adds GROUP BY clauses.
   * @param value List of fields to group by.
   */
  addGroup(...value: Array<QueryableFields<Table>>) {
    if (this.group.length + value.length > this.config.maxGroupByClauses) {
      throw new RangeError(`Maximum GROUP BY clauses exceeded: ${this.config.maxGroupByClauses}`);
    }
    const newGroups = value.map((element) => this.column(element));
    this.group = [...this.group, ...newGroups];
    return this;
  }

  /**
   * Sets the LIMIT for the query.
   * @param limit Maximum number of records to return.
   */
  addLimit(limit: number | null | undefined) {
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
  addOffset(offset: number | null | undefined) {
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
   * Builds the SQL query with parameterized values (prepared statement format).
   * This is the recommended way to generate queries for execution against a database.
   * @returns An object containing the SQL string with placeholders ($1, $2, etc.) and the array of parameter values.
   */
  build(): ParameterizedQuery {
    let finalSql = this.sql;
    const allParams: Nullable<PrimitiveValueTypes>[] = [];
    let paramIndex = 1;

    if (this.where.length > 0) {
      const whereParts: string[] = [];

      for (const w of this.where) {
        if (typeof w === 'string') {
          whereParts.push(w);
        } else {
          const built = w.build({ startParamIndex: paramIndex });
          if (built) {
            whereParts.push(`(${built.sql})`);
            allParams.push(...built.params);
            paramIndex += built.params.length;
          }
        }
      }

      if (whereParts.length > 0) {
        finalSql = `${finalSql} ${SQL_KEYWORDS.WHERE} ${whereParts.join(` ${SQL_KEYWORDS.AND} `)}`;
      }
    }

    if (this.group.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.GROUP_BY} ${this.group.join(', ')}`;
    }

    if (this.order.length > 0) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.ORDER_BY} ${this.order.join(', ')}`;
    }

    if (this.limit > SQL_BUILDER_CONSTANTS.NO_LIMIT) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.LIMIT} ${this.limit}`;
    }

    if (this.offset > SQL_BUILDER_CONSTANTS.NO_OFFSET) {
      finalSql = `${finalSql} ${SQL_KEYWORDS.OFFSET} ${this.offset}`;
    }

    return {
      sql: finalSql.replace(/\s+/g, ' ').trim(),
      params: allParams,
    };
  }

  /**
   * Creates a deep clone of this SqlBuilder instance
   * Useful for creating derived queries from a base query
   */
  clone(): SqlBuilder<Table> {
    const cloned = new SqlBuilder<Table>(this.sql, this.columnMapper, this.config);
    cloned.where = [...this.where];
    cloned.order = [...this.order];
    cloned.group = [...this.group];
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
  where: [${this.where.length} clauses],
  order: [${this.order.map((o) => `"${o}"`).join(', ')}],
  group: [${this.group.map((g) => `"${g}"`).join(', ')}],
  limit: ${this.limit},
  offset: ${this.offset}
}`;
  }

  /**
   * Returns a JSON representation of the builder state
   */
  toJSON() {
    return {
      base: this.sql,
      where: '...Serialized clauses not supported...',
      order: [...this.order],
      group: [...this.group],
      limit: this.limit,
      offset: this.offset,
      sql: this.build().sql,
    };
  }
}
