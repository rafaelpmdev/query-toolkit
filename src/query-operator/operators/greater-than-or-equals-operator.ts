import { isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import { parseRsqlValue } from '../../common/date-parser';
import type { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class GreaterThanOrEqualsOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('gte=', params);
  }

  value() {
    return parseRsqlValue(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    const value = this.value();
    if (isNullOrUndefined(value)) return value;
    return { gte: value } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitGreaterThanOrEquals(this, field);
  }
}
