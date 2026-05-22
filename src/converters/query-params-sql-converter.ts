import { QueryParamsOperator } from '../query-operator';
import { Clause } from '../sql-builder';
import { QueryableFields } from '../types';
import { ClauseVisitor } from './clause-visitor';
import { QueryParamsConverter } from './query-params-converter';
import { IQueryParamsConverter } from './query-params-converter-interface';

export class QueryParamsSqlConverter<T = unknown> implements IQueryParamsConverter<Clause[]> {
  private converter: QueryParamsConverter<T>;
  private visitor: ClauseVisitor;
  constructor(
    private readonly operators: Partial<
      Record<QueryableFields<T>, QueryParamsOperator | QueryParamsOperator[]>
    >
  ) {
    this.converter = new QueryParamsConverter<T>(this.operators);
    this.visitor = new ClauseVisitor();
  }

  build(): Record<string, Clause[]> {
    return this.converter.to(this.visitor);
  }
}
