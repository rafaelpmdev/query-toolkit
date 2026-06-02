import { Nullable } from '@raicampos/toolkit';
import { parseRsqlValue } from '../../common/date-parser';
import type { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class BetweenOperator extends QueryParamsOperator {
  constructor(params: string) {
    super('btw=', params);
  }

  value(): [string | number | Date, string | number | Date] {
    const [gte, lte] = this.getRawValue().split(',');

    return [
      parseRsqlValue(gte) as string | number | Date,
      parseRsqlValue(lte) as string | number | Date,
    ];
  }

  query(): Nullable<RsqlCondition> {
    const [gte, lte] = this.value();
    return { gte, lte } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitBetween(this, field);
  }
}
