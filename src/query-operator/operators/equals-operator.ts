import { Nullable } from '@raicampos/toolkit';
import { EqualsCondition } from '../../common/types';
import { PrimitiveValue, PrimitiveValueType } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class EqualsOperator<
  ValueType extends PrimitiveValueType = PrimitiveValueType,
> extends QueryParamsOperator<EqualsCondition<ValueType>, ValueType> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('==', params);
    this.stateValue = PrimitiveValue.converter(this.getRawValue());
  }

  safeParse(): QueryParamsOperatorSafeParse<ValueType> {
    const value = this.value();
    if (value === null || value === undefined) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }
    if (this.isArray()) {
      return { success: false, error: 'Expected single value, got array' };
    }
    return { success: true, value };
  }

  value(): Nullable<ValueType> {
    return this.stateValue.getValue() as Nullable<ValueType>;
  }

  query(): Nullable<EqualsCondition<ValueType>> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { equals: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitEquals(this, field);
  }
}
