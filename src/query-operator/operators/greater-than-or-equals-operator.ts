import { Nullable } from '@raicampos/toolkit';
import { GreaterThanOrEqualsCondition } from '../../common/types';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class GreaterThanOrEqualsOperator extends QueryParamsOperator<
  GreaterThanOrEqualsCondition<number | Date>,
  number | Date
> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('gte=', params);
    this.stateValue = PrimitiveValue.converter(this.getRawValue());
  }

  safeParse(): QueryParamsOperatorSafeParse<number | Date> {
    const value = this.value();
    if (value === null || value === undefined) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }
    if (this.isArray()) {
      return { success: false, error: 'Expected single value, got array' };
    }
    return { success: true, value };
  }

  value(): Nullable<number | Date> {
    return this.stateValue.asNumericOrDate();
  }

  query(): Nullable<GreaterThanOrEqualsCondition<number | Date>> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { gte: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitGreaterThanOrEquals(this, field);
  }
}
