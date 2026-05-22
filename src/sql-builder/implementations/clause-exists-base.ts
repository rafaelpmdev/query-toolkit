import { isEmpty } from '@raicamposs/toolkit';
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
        `EXISTS clause requires a SELECT subquery. Received: ${trimmedSql.substring(0, 50)}...`
      );
    }

    // Check for SQL injection patterns
    if (SqlInjectionDetector.detect(this.sql)) {
      throw new Error(`SQL injection detected in EXISTS subquery: ${this.sql.substring(0, 50)}...`);
    }

    const prefix = this.getPrefix().trim();
    const sql = this.sql.trim();

    if (prefix.length > 0) {
      return `${prefix} EXISTS (${sql})`;
    }

    return `EXISTS (${sql})`;
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
