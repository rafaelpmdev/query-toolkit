import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlValue } from '../../common/date-parser';
import type { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class LessThanOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('lt=', params);
  }

  value() {
    return parseRsqlValue(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { lt: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitLessThan(this, field);
  }
}
