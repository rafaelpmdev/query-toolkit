import { isEmpty, isNullOrUndefined } from '@raicampos/toolkit';
import { Clause } from '../core/clause';
import { SqlPrimitiveValue } from '../core/sql-primitive-value';

export type BetweenParam = Date | string | number;

export class ClauseBetween extends Clause {
  private readonly start: SqlPrimitiveValue;
  private readonly end: SqlPrimitiveValue;

  constructor(
    private readonly field: string,
    start: BetweenParam,
    end: BetweenParam
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.start = new SqlPrimitiveValue(start);
    this.end = new SqlPrimitiveValue(end);
  }

  build(option?: { startParamIndex?: number }) {
    const valueStart = this.start.toValue();
    const valueEnd = this.end.toValue();

    if (isNullOrUndefined(valueStart) || isNullOrUndefined(valueEnd)) return undefined;

    const index = option?.startParamIndex ?? 1;
    return {
      sql: `${this.field} BETWEEN $${index} AND $${index + 1}`,
      params: [valueStart, valueEnd],
    };
  }
}
