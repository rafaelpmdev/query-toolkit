import { Nullable } from '@raicampos/toolkit';
import { ContainsCondition } from '../../common/types';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export class ContainsOperator extends QueryParamsOperator<ContainsCondition, string> {
  private stateValue: PrimitiveValue;

  constructor(params: string) {
    super('~=', params);
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

  query(): Nullable<ContainsCondition> {
    const value = this.value();
    if (value === null || value === undefined) return null;
    return { contains: value };
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitContains(this, field);
  }
}
