import { isAssigned, isEmpty, isNullOrUndefined } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveValue } from '../core/primitive-value';

export class ClauseContains extends Clause {
  private readonly compareFields: PrimitiveValue[];

  constructor(
    private readonly field: string,
    compareFields: string[],
    private readonly containment: '<@' | '@>' = '<@'
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.compareFields = compareFields
      .filter((item) => isAssigned(item))
      .map((item) => new PrimitiveValue(item));
  }

  build(option?: { startParamIndex?: number }) {
    if (isNullOrUndefined(this.compareFields)) return undefined;
    if (this.compareFields.length === 0) return undefined;

    let index = option?.startParamIndex ?? 1;
    const placeholders = this.compareFields.map(() => `$${index++}`).join(', ');
    const params = this.compareFields.map((item) => item.toValue());

    return {
      sql: `array[${this.field}]::text[] ${this.containment} array[${placeholders}]`,
      params,
    };
  }
}
