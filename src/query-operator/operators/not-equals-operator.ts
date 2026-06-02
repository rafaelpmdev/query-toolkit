import { Nullable } from '@raicampos/toolkit';
import { NotEqualsCondition } from '../../common/types';
import { PrimitiveValue, PrimitiveValueType } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class NotEqualsOperator extends QueryParamsOperator<
  NotEqualsCondition<PrimitiveValueType>,
  PrimitiveValueType
> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('!=', params);
    this.stateValue = PrimitiveValue.converter(this.getRawValue());
  }

  safeParse(): QueryParamsOperatorSafeParse<PrimitiveValueType> {
    const value = this.value();
    if (value === null || value === undefined) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }
    if (this.isArray()) {
      return { success: false, error: 'Expected single value, got array' };
    }
    return { success: true, value };
  }

  value(): Nullable<PrimitiveValueType> {
    return this.stateValue.getValue();
  }

  query(): Nullable<NotEqualsCondition<PrimitiveValueType>> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { notEquals: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotEquals(this, field);
  }
}
