import { QueryParamsOperator } from '../query-operator';
import { QueryableFields } from '../types';
import { PrismaVisitor, PrismaWhereClause } from './prisma-visitor';
import { QueryParamsConverter } from './query-params-converter';
import { IQueryParamsConverter } from './query-params-converter-interface';

export class QueryParamsPrismaConverter<T = unknown> implements IQueryParamsConverter<unknown> {
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
