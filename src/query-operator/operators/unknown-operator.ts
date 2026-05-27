import { Nullable } from '@raicamposs/toolkit';
import { parseRsqlValue } from '../../common/date-parser';
import { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class UnknownOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('', params);
  }

  value() {
    return parseRsqlValue(this.params);
  }

  query(): Nullable<RsqlCondition> {
    return {
      equals: this.value(),
    } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitUnknown(this, field);
  }
}
