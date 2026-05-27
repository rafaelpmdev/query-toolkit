import { SortDirection } from '../../../common';
import { QueryParamsOperator } from '../../../query-operator';
import { Clause } from '../../../sql-builder';
import { QueryableFields } from '../../../types';
import { QueryParamsConverter } from '../../core/query-params-converter';
import { IQueryParamsConverter } from '../../core/query-params-converter-interface';
import { ISortConverter } from '../../core/sort-converter-interface';
import { ClauseVisitor } from '../visitors/clause-visitor';

export type SqlOrderByClause = Record<string, SortDirection>;

export class QueryParamsSqlConverter<T = unknown>
  implements IQueryParamsConverter<Clause[]>, ISortConverter<SqlOrderByClause>
{
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

  sort(sort?: Record<string, SortDirection>): SqlOrderByClause | undefined {
    return sort;
  }

  build(): Record<string, Clause[]> {
    return this.converter.to(this.visitor);
  }
}
