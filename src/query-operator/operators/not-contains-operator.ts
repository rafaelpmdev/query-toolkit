import { Nullable } from '@raicampos/toolkit';
import { NotContainsCondition } from '../../common/types';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class NotContainsOperator extends QueryParamsOperator<NotContainsCondition<string>, string> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('!~=', params);
    this.stateValue = PrimitiveValue.converter(this.getRawValue().trim());
  }

  safeParse(): QueryParamsOperatorSafeParse<string> {
    const value = this.value();
    if (value === null || value === undefined) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }
    if (this.isArray()) {
      return { success: false, error: 'Expected single value, got array' };
    }
    return { success: true, value };
  }

  value(): Nullable<string> {
    return this.stateValue.asString();
  }

  query(): Nullable<NotContainsCondition<string>> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { notContains: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitNotContains(this, field);
  }
}
