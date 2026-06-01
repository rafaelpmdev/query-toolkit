import { isEmpty, isNullOrUndefined } from '@raicampos/toolkit';
import { QueryableFields } from '../../types';
import { Clause } from './clause';
import { SQL_BUILDER_CONSTANTS } from './constants';
import { PrimitiveValueTypes } from './primitive-value';
import { InvalidCursorError } from './sql-builder-errors';
import { TransformFunction } from './transform-function';
import { SqlBuilderConfig } from './config';
import {
  BetweenParam,
  ClauseAnd,
  ClauseArrayIsContainedBy,
  ClauseArrayOverlap,
  ClauseBetween,
  ClauseCondition,
  ClauseContains,
  ClauseCursor,
  ClauseEquals,
  ClauseExists,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseIsEmpty,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseLike,
  ClauseNotEquals,
  ClauseNotExists,
  ClauseNotILike,
  ClauseNotIn,
  ClauseOr,
  ClauseRaw,
  Condition,
} from '../implementations';

export abstract class FilterBuilder<Table> {
  protected where: Clause[] = [];
  protected readonly config: SqlBuilderConfig;

  constructor(
    protected readonly columnMapper?: Partial<Record<keyof Table & string, string>>,
    config?: SqlBuilderConfig
  ) {
    // config must be fully initialized. When called from child class, config will be passed
    this.config = config || {
      maxWhereClauses: SQL_BUILDER_CONSTANTS.MAX_WHERE_CLAUSES,
      maxOrderByClauses: SQL_BUILDER_CONSTANTS.MAX_ORDER_BY_CLAUSES,
      maxGroupByClauses: SQL_BUILDER_CONSTANTS.MAX_GROUP_BY_CLAUSES,
      maxLimit: SQL_BUILDER_CONSTANTS.MAX_LIMIT,
      maxJoins: SQL_BUILDER_CONSTANTS.MAX_JOINS,
    };
  }

  protected column(field: QueryableFields<Table>): string {
    const fieldStr = field.toString();
    const mapped = this.columnMapper?.[fieldStr as keyof Table & string];
    if (mapped) {
      return mapped;
    }
    return fieldStr;
  }

  /** Filter Elements - Add where clause filters */
  protected andFilter(value: Clause): this {
    if (this.where.length >= this.config.maxWhereClauses) {
      throw new RangeError(`Maximum WHERE clauses exceeded: ${this.config.maxWhereClauses}`);
    }
    this.where.push(value);
    return this;
  }

  whereClause(clause: Clause): this {
    return this.andFilter(clause);
  }

  whereClauses(clauses: Clause[]): this {
    for (const clause of clauses) {
      this.whereClause(clause);
    }
    return this;
  }

  whereExists(sql: string): this {
    return this.andFilter(new ClauseExists(sql));
  }

  whereNotExists(sql: string): this {
    return this.andFilter(new ClauseNotExists(sql));
  }

  /**
   * Adds a WHERE IN clause.
   * @param field The field to filter on.
   * @param compareFields The array of values to check against.
   */
  whereIn(field: QueryableFields<Table>, compareFields: PrimitiveValueTypes[]): this {
    return this.andFilter(new ClauseIn(this.column(field), compareFields));
  }

  /**
   * Adds a WHERE NOT IN clause.
   * @param field The field to filter on.
   * @param compareFields The array of values to exclude.
   */
  whereNotIn(field: QueryableFields<Table>, compareFields: PrimitiveValueTypes[]): this {
    return this.andFilter(new ClauseNotIn(this.column(field), compareFields));
  }

  /**
   * Adds a WHERE LIKE clause.
   * @param field The field to filter on.
   * @param value The pattern to match (e.g., "%value%").
   */
  whereLike(field: QueryableFields<Table>, value: string): this {
    return this.andFilter(new ClauseLike(this.column(field), value));
  }

  /**
   * Adds a WHERE ILIKE clause (case-insensitive LIKE).
   * @param field The field to filter on.
   * @param value The pattern to match.
   */
  whereILike(field: QueryableFields<Table>, value: string): this {
    return this.andFilter(new ClauseILike(this.column(field), value));
  }

  /**
   * Adds a WHERE NOT ILIKE clause (case-insensitive NOT LIKE).
   * @param field The field to filter on.
   * @param value The pattern to match.
   */
  whereNotILike(field: QueryableFields<Table>, value: string): this {
    return this.andFilter(new ClauseNotILike(this.column(field), value));
  }

  /**
   * Adds a WHERE BETWEEN clause.
   * @param field The field to filter on.
   * @param start The start value (inclusive).
   * @param end The end value (inclusive).
   */
  whereBetween(field: QueryableFields<Table>, start: BetweenParam, end: BetweenParam): this {
    return this.andFilter(new ClauseBetween(this.column(field), start, end));
  }

  whereGreaterThan(field: QueryableFields<Table>, value: Date | number): this {
    return this.andFilter(new ClauseGreaterThan(this.column(field), value));
  }

  whereGreaterThanOrEquals(field: QueryableFields<Table>, value: Date | number): this {
    return this.andFilter(new ClauseGreaterThanOrEquals(this.column(field), value));
  }

  whereLessThan(field: QueryableFields<Table>, value: Date | number): this {
    return this.andFilter(new ClauseLessThan(this.column(field), value));
  }

  whereLessThanOrEquals(field: QueryableFields<Table>, value: Date | number): this {
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
  ): this {
    return this.andFilter(new ClauseBetween(this.column(field), operator.gte, operator.lte));
  }

  /**
   * Adds a WHERE = clause.
   * @param field The field to filter on.
   * @param value The value to match.
   */
  whereEquals(field: QueryableFields<Table>, value: string | number | boolean): this {
    return this.andFilter(new ClauseEquals(this.column(field), value));
  }

  /**
   * Adds a WHERE != clause.
   * @param field The field to filter on.
   * @param value The value to exclude.
   */
  whereNotEquals(field: QueryableFields<Table>, value: string | number | boolean): this {
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
  ): this {
    return this.andFilter(new ClauseContains(this.column(field), compareFields, containment));
  }

  /**
   * Filter where field is contained by a specified array
   * @param field - Field name
   * @param compareFields - Array of values
   */
  whereArrayIsContainedBy(field: QueryableFields<Table>, compareFields: string[]): this {
    return this.andFilter(new ClauseArrayIsContainedBy(this.column(field), compareFields));
  }

  /**
   * Filter where field array overlaps with another array
   * @param field - Field name
   * @param compareFields - Array of values
   */
  whereArrayOverlap(field: QueryableFields<Table>, compareFields: string[]): this {
    return this.andFilter(new ClauseArrayOverlap(this.column(field), compareFields));
  }

  /**
   * Filter checking if a field is empty (NULL or empty string/array representation)
   * @param field - Field name
   */
  whereEmpty(field: QueryableFields<Table>): this {
    return this.andFilter(new ClauseIsEmpty(this.column(field)));
  }

  /**
   * Adds multiple conditions from an object.
   * @param values Object where keys are fields and values are conditions.
   * @param transform Optional function to transform values before building clauses.
   *
   * Note: uses isNullOrUndefined() instead of a falsy check so that legitimate
   * condition objects are never silently discarded.
   */
  whereConditions(
    values: Partial<Record<QueryableFields<Table>, Condition>>,
    transform?: TransformFunction
  ): this {
    for (const [key, value] of Object.entries(values)) {
      if (!isNullOrUndefined(value)) {
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
  whereCondition(
    field: QueryableFields<Table>,
    value: Condition,
    transform?: TransformFunction
  ): this {
    return this.andFilter(new ClauseCondition(field.toString(), value, transform));
  }

  protected checkSecurity(sql: string, params: unknown[]): void {
    const isNonProd = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
    const enabled = this.config.enableSecurityWarnings ?? isNonProd;
    if (!enabled) {
      return;
    }

    if (params.length === 0) {
      const hasLiteralQuotes = /'[^$]*'|"[^$]*"/.test(sql);
      const hasSuspiciousConcatenation = /=|LIKE|ILIKE|IN/i.test(sql) && hasLiteralQuotes;
      if (hasSuspiciousConcatenation) {
        // eslint-disable-next-line no-console
        console.warn(
          `[SqlBuilder Security Warning] Potential SQL Injection or unparameterized literal detected in raw expression: "${sql}". ` +
            `Consider using parameterized inputs (placeholders like $1) instead of hardcoding literals inside raw clauses.`
        );
      }
    }
  }

  /**
   * Adds a raw WHERE SQL string, with optional parameters to prevent SQL injection.
   * @param raw The raw SQL query part (e.g. "age > ?" or "active = true").
   * @param params Parameters to bind to the raw query placeholders.
   *
   * Note: passes through andFilter() so that maxWhereClauses is always respected.
   */
  whereRaw(raw: string, params: PrimitiveValueTypes[] = []): this {
    if (!isEmpty(raw)) {
      this.checkSecurity(raw, params);
      this.andFilter(new ClauseRaw(raw, params));
    }
    return this;
  }

  /**
   * Filter PostgreSQL JSONB field containing a specific JSON object or value.
   * Compiles to: `field @> ?`
   *
   * @param field - The JSONB field name.
   * @param jsonValue - The object, array, or primitive value that must be contained.
   */
  whereJsonbContains(
    field: QueryableFields<Table>,
    jsonValue: Record<string, unknown> | unknown[] | string | number | boolean
  ): this {
    const boundValue = typeof jsonValue === 'object' ? JSON.stringify(jsonValue) : jsonValue;
    return this.andFilter(
      new ClauseRaw(`${this.column(field)} @> ?`, [boundValue as PrimitiveValueTypes])
    );
  }

  /**
   * Filter checking if a top-level key exists within a PostgreSQL JSONB field.
   * Compiles to: `jsonb_exists(field, ?)` which is safe and compatible.
   *
   * @param field - The JSONB field name.
   * @param key - The key name.
   */
  whereJsonbExists(field: QueryableFields<Table>, key: string): this {
    return this.andFilter(new ClauseRaw(`jsonb_exists(${this.column(field)}, ?)`, [key]));
  }

  /**
   * Filter checking if a JSON path matches a specific value.
   * Compiles to: `field -> 'user' ->> 'role' = ?`
   *
   * @param field - The JSONB field name.
   * @param path - The dot-notation path (e.g. 'metadata.user.role').
   * @param operator - Comparison operator ('=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'ILIKE')
   * @param value - The value to compare against.
   */
  whereJsonbPath(
    field: QueryableFields<Table>,
    path: string,
    operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'ILIKE',
    value: string | number | boolean
  ): this {
    const parts = path.split('.');
    let pathExpr = this.column(field);
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const op = isLast ? '->>' : '->';
      pathExpr += ` ${op} '${parts[i]}'`;
    }

    return this.andFilter(
      new ClauseRaw(`${pathExpr} ${operator} ?`, [value as PrimitiveValueTypes])
    );
  }

  /**
   * Adds an OR clause containing multiple sub-clauses.
   * @param value List of clauses to join with OR.
   */
  orFilter(...value: Clause[]): this {
    return this.andFilter(new ClauseOr(...value));
  }

  /**
   * Adds an AND clause containing multiple sub-clauses.
   * @param clauses List of clauses to join with AND.
   */
  whereAnd(...clauses: Clause[]): this {
    return this.andFilter(new ClauseAnd(...clauses));
  }

  /**
   * Adiciona um filtro de paginação por cursor (Keyset Pagination) de alta performance.
   * Suporta cursores decodificados (objeto contendo os valores dos campos de ordenação)
   * ou strings encodadas em Base64 de forma transparente.
   *
   * @param cursor String Base64 contendo um JSON ou objeto decodificado com os valores de ordenação da última linha.
   * @param orders Lista de campos de ordenação e suas respectivas direções. Deve bater exatamente com a ordenação da query.
   */
  whereCursor(
    cursor: string | Record<string, unknown> | undefined | null,
    orders: Array<{ field: QueryableFields<Table>; direction: 'asc' | 'desc' }>
  ): this {
    if (!cursor) {
      return this;
    }

    const decodedCursor = typeof cursor === 'string' ? this.decodeCursorString(cursor) : cursor;

    // Suporta tanto o payload encapsulado do CursorPage/CursorCodec (propriedade values)
    // quanto um objeto plano chave-valor para retrocompatibilidade
    const targetSource =
      decodedCursor && typeof decodedCursor === 'object' && 'values' in decodedCursor
        ? (decodedCursor.values as Record<string, unknown>)
        : decodedCursor;

    if (!targetSource || typeof targetSource !== 'object') {
      throw new InvalidCursorError('Invalid cursor format. Expected a key-value record');
    }

    const cursorItems = orders.map((order) => {
      const fieldStr = order.field.toString();
      const value = targetSource[fieldStr];
      if (value === undefined) {
        throw new InvalidCursorError(`Cursor is missing value for field: ${fieldStr}`);
      }

      return {
        column: this.column(order.field),
        value: value as PrimitiveValueTypes,
        direction: order.direction,
      };
    });

    return this.andFilter(new ClauseCursor(cursorItems));
  }

  /**
   * Decodes a Base64-encoded cursor string to a plain object.
   * Extracted to a private method to simplify whereCursor() and enable isolated testing.
   *
   * @throws InvalidCursorError when the string is not valid Base64 JSON.
   */
  private decodeCursorString(raw: string): Record<string, unknown> {
    try {
      const json = Buffer.from(raw, 'base64').toString('utf-8');
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new InvalidCursorError('Invalid cursor encoding. Must be a valid Base64 JSON string');
    }
  }
}
