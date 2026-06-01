import { isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import type { OperatorVisitor } from '../../converters';
import { ArrayParamsValuesSchema, RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class ArrayContainsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('@>', params);
  }

  value() {
    const filters = this.getRawValue()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    return ArrayParamsValuesSchema.parse(filters);
  }

  query(): Nullable<RsqlCondition> {
    const value = this.value();
    if (isNullOrUndefined(value)) return undefined;
    return { arrayContains: value } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitArrayContains(this, field);
  }
}
