import { Nullable } from '@raicamposs/toolkit';
import { z } from 'zod';
import type { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

const Schema = z.string().trim();

export class ContainsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('~=', params);
  }

  value() {
    return Schema.parse(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { contains: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitContains(this, field);
  }
}
