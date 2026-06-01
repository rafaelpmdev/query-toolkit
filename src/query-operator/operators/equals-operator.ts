import { Nullable } from '@raicampos/toolkit';
import { z } from 'zod';
import type { OperatorVisitor } from '../../converters';
import { BoolSchema, DateSchema, NumberSchema, RsqlCondition, StringSchema } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class EqualsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('==', params);
  }

  value() {
    const Schema = z.union([NumberSchema, BoolSchema, DateSchema, StringSchema]);
    return Schema.parse(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { equals: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitEquals(this, field);
  }
}
