import { Nullable } from '@raicampos/toolkit';
import { BetweenCondition } from '../../common/types';
import { PrimitiveValue } from '../../common/types/primitive-value';
import type { OperatorVisitor } from '../../converters';
import { QueryParamsOperator, QueryParamsOperatorSafeParse } from '../query-params-operator';

export type BetweenValue = {
  gte: number | Date;
  lte: number | Date;
};

export class BetweenOperator extends QueryParamsOperator<
  BetweenCondition<number | Date>,
  BetweenValue
> {
  private stateValues: PrimitiveValue[];

  constructor(params: string) {
    super('btw=', params);
    this.stateValues = PrimitiveValue.converterArray(this.getRawValue());
  }

  safeParse(): QueryParamsOperatorSafeParse<BetweenValue> {
    if (this.isNullOrUndefined()) {
      return { success: false, error: `Invalid value for ${this.symbol} operator` };
    }

    if (!this.isArray() || this.stateValues.length !== 2) {
      return {
        success: false,
        error: `Expected exactly 2 values for ${this.symbol} operator`,
      };
    }

    const value = this.value();
    if (value === null || value === undefined) {
      return { success: false, error: `Invalid numeric/date values for ${this.symbol} operator` };
    }
    return { success: true, value };
  }

  value(): Nullable<BetweenValue> {
    const values = this.stateValues
      .map((v) => v.asNumericOrDate())
      .filter((v): v is number | Date => v !== null && v !== undefined);

    if (values.length !== 2) return null;
    return { gte: values[0], lte: values[1] };
  }

  query(): Nullable<BetweenCondition<number | Date>> {
    const value = this.value();
    if (!value) return null;
    return value;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitBetween(this, field);
  }
}
