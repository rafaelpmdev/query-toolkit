import { Clause } from '../core/clause';
import { PrimitiveValueTypes } from '../core/primitive-value';

/**
 * Representa uma cláusula SQL crua e customizada, com suporte a parametrização segura.
 * Substitui placeholders "?" sequenciais pelos equivalentes do PostgreSQL ($1, $2, etc.).
 */
export class ClauseRaw extends Clause {
  constructor(
    private readonly rawSql: string,
    private readonly rawParams: PrimitiveValueTypes[] = []
  ) {
    super();
  }

  public build(options?: { startParamIndex?: number }) {
    const start = options?.startParamIndex ?? 1;
    let sql = this.rawSql;
    let index = start;

    // Substitui "?" sequenciais por "$index"
    sql = sql.replace(/\?/g, () => `$${index++}`);

    return {
      sql,
      params: [...this.rawParams],
    };
  }
}
