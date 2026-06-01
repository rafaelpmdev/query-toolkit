import { Nullable } from '@raicampos/toolkit';
import type { OperatorVisitor } from '../../converters';
import { ArrayParamsValuesSchema, RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class ArrayIsContainedByOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('<@', params);
  }

  value() {
    const filters = this.getRawValue()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    return ArrayParamsValuesSchema.parse(filters);
  }

  query(): Nullable<RsqlCondition> {
    return { arrayIsContainedBy: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitArrayIsContainedBy(this, field);
  }
}
