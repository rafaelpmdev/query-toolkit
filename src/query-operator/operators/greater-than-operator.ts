import { Nullable } from '@raicampos/toolkit';
import { GreaterThanCondition } from '../../common/types';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class GreaterThanOperator extends QueryParamsOperator<
  GreaterThanCondition<number | Date>,
  number | Date
> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('gt=', params);
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

  query(): Nullable<GreaterThanCondition<number | Date>> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { gt: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitGreaterThan(this, field);
  }
}
