import { isEmpty } from '@raicampos/toolkit';
import { SqlInjectionDetector } from '../../common/sql-injection-detector';
import { Clause } from '../core/clause';

/**
 * Base class for EXISTS and NOT EXISTS clauses.
 * Provides common validation and SQL generation logic for subquery existence checks.
 */
export abstract class ClauseExistsBase extends Clause {
  constructor(protected readonly sql: string) {
    super();
  }

  /**
   * Returns the prefix for the EXISTS clause (empty string or 'NOT ')
   */
  protected abstract getPrefix(): string;

  /**
   * Validates and builds the EXISTS/NOT EXISTS SQL clause
   * @returns The formatted SQL string or undefined if the input is empty
   * @throws Error if SQL injection is detected or if the subquery is invalid
   */
  private buildSql() {
    if (isEmpty(this.sql)) return undefined;

    const trimmedSql = this.sql.trim();

    // Validate that the SQL is a SELECT subquery
    if (!trimmedSql.toUpperCase().startsWith('SELECT')) {
      throw new Error(
        `EXISTS clause requires a SELECT subquery. Received: ${ClauseExistsBase.preview(trimmedSql)}`
      );
    }

    // Check for SQL injection patterns
    if (SqlInjectionDetector.detect(this.sql)) {
      throw new Error(
        `SQL injection detected in EXISTS subquery: ${ClauseExistsBase.preview(this.sql)}`
      );
    }

    const prefix = this.getPrefix().trim();
    const sql = this.sql.trim();

    if (prefix.length > 0) {
      return `${prefix} EXISTS (${sql})`;
    }

    return `EXISTS (${sql})`;
  }

  /**
   * Returns a safe preview of a SQL string for error messages.
   * Appends '...' only when the string exceeds the threshold, avoiding
   * misleading ellipsis on short inputs.
   */
  private static preview(sql: string, maxLength = 50): string {
    return sql.length > maxLength ? `${sql.substring(0, maxLength)}...` : sql;
  }

  build(_option?: { startParamIndex?: number }) {
    const built = this.buildSql();
    if (!built) return undefined;

    return {
      sql: built,
      params: [],
    };
  }
}
