import { Clause } from '../core/clause';

/**
 * Representa uma cláusula SQL vazia ou inativa.
 * Utilizada como representação Null Object para evitar classes anônimas dinâmicas e ifs desnecessários.
 */
export class ClauseEmpty extends Clause {
  public build(_option?: { startParamIndex?: number }): undefined {
    return undefined;
  }
}
