import { isNullOrUndefined } from '@raicampos/toolkit';
import { SortDirection } from '../../../common';
import { QueryParamsOperator } from '../../../query-operator';
import { QueryableFields } from '../../../types';
import { QueryParamsConverter } from '../../core/query-params-converter';
import { IQueryParamsConverter } from '../../core/query-params-converter-interface';
import { ISortConverter } from '../../core/sort-converter-interface';
import { PrismaVisitor, PrismaWhereClause } from '../visitors/prisma-visitor';

export type PrismaOrderByClause = Array<Record<string, SortDirection>>;

export class QueryParamsPrismaConverter<T = unknown>
  implements IQueryParamsConverter<unknown>, ISortConverter<PrismaOrderByClause>
{
  private converter: QueryParamsConverter<T>;
  private visitor: PrismaVisitor;
  constructor(
    private readonly operators: Partial<
      Record<QueryableFields<T>, QueryParamsOperator | QueryParamsOperator[]>
    >
  ) {
    this.converter = new QueryParamsConverter<T>(this.operators);
    this.visitor = new PrismaVisitor();
  }

  sort(sort?: Record<string, SortDirection>): PrismaOrderByClause | undefined {
    if (isNullOrUndefined(sort)) return sort;
    return Object.entries(sort).map(([key, value]) => ({
      [key]: value,
    }));
  }

  build(): Record<string, unknown> {
    const converted = this.converter.to(this.visitor);
    const mergedResult: Record<string, unknown> = {};

    for (const [field, clauses] of Object.entries(converted)) {
      if (clauses.length === 0) continue;

      if (clauses.length === 1) {
        Object.assign(mergedResult, clauses[0]);
        continue;
      }

      this.mergePrismaFieldClauses(mergedResult, field, clauses);
    }

    return mergedResult;
  }

  private mergePrismaFieldClauses(
    target: Record<string, unknown>,
    field: string,
    clauses: PrismaWhereClause[]
  ): void {
    const values = clauses.map((c) => c[field]);
    const isEveryValueObject = values.every(
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    );

    if (isEveryValueObject) {
      target[field] = Object.assign({}, ...values);
      return;
    }

    target[field] = values[values.length - 1];
  }
}
