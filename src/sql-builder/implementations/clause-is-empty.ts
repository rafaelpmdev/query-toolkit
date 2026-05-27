import { Clause } from '../core/clause';

/**
 * Representa um filtro SQL para verificar se um campo está vazio (nulo ou string/array vazio).
 */
export class ClauseIsEmpty extends Clause {
  constructor(private readonly field: string) {
    super();
  }

  public build(_option?: { startParamIndex?: number }) {
    return {
      sql: `${this.field} IS NULL OR ${this.field} = ''`,
      params: [],
    };
  }
}
