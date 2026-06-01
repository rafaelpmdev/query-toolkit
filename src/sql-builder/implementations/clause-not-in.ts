import { isEmpty } from '@raicampos/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveArrayValue } from '../core/primitive-array-value';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseNotIn extends Clause {
  private readonly compareFields: PrimitiveArrayValue;
  constructor(
    private readonly field: string,
    compareFields: PrimitiveValueTypes[]
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.compareFields = new PrimitiveArrayValue(compareFields);
  }

  build(option?: { startParamIndex?: number }) {
    const values = this.compareFields.toValue();
    if (isEmpty(values)) return undefined;

    let index = option?.startParamIndex ?? 1;
    const placeholders = values.map(() => `$${index++}`).join(', ');

    return {
      sql: `NOT ${this.field} IN (${placeholders})`,
      params: values,
    };
  }
}
