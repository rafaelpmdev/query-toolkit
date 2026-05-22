import { QueryParamsOperator } from '../query-operator';
import { QueryableFields } from '../types';
import { OperatorVisitor } from './operator-visitor';

/**
 * Classe auxiliar para converter múltiplas instâncias de QueryParamsOperator em diferentes formatos.
 */
export class QueryParamsConverter<T = unknown> {
  constructor(
    private readonly operators: Partial<
      Record<QueryableFields<T>, QueryParamsOperator | QueryParamsOperator[]>
    >
  ) {}

  /**
   * Converte os operadores usando o visitor fornecido.
   */
  public to<R>(visitor: OperatorVisitor<R>): Record<string, R[]> {
    const convertedMap: Record<string, R[]> = {};

    for (const [field, data] of Object.entries(this.operators)) {
      if (!data) continue;
      const operatorList = Array.isArray(data) ? data : [data];

      const validOperators = operatorList.filter(
        (op): op is QueryParamsOperator => op instanceof QueryParamsOperator
      );

      if (validOperators.length === 0) continue;

      convertedMap[field] = validOperators.map((operator) => operator.accept(visitor, field));
    }

    return convertedMap;
  }
}
