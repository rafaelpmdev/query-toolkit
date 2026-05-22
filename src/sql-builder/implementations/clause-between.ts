import { isEmpty, isNullOrUndefined } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveValue } from '../core/primitive-value';

export type BetweenParam = Date | string | number;

export class ClauseBetween extends Clause {
  private readonly start: PrimitiveValue;
  private readonly end: PrimitiveValue;

  constructor(
    private readonly field: string,
    start: BetweenParam,
    end: BetweenParam
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.start = new PrimitiveValue(start);
    this.end = new PrimitiveValue(end);
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
