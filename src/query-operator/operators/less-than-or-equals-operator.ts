import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlValue } from '../../common/date-parser';
import type { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class LessThanOrEqualOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('lte=', params);
  }

  value() {
    return parseRsqlValue(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { lte: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitLessThanOrEquals(this, field);
  }
}
