import { Nullable } from '@raicamposs/toolkit';
import { OperatorVisitor } from '../../converters';
import { RsqlCondition } from '../../types';
import { QueryParamsOperator } from '../query-params-operator';

export class InOperator extends QueryParamsOperator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public readonly values: any[]) {
    super('in=', '');
    if (!Array.isArray(values)) {
      throw new Error('Values must be an array');
    }
  }

  value() {
    return this.values;
  }

  query(): Nullable<RsqlCondition> {
    return { in: this.value() } as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return visitor.visitIn(this, field);
  }
}
