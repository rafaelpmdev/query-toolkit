import { isEmpty } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveArrayValue } from '../core/primitive-array-value';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseArrayContains extends ClauseBase {
  private readonly arrayValue: PrimitiveArrayValue;

  constructor(field: string, value: PrimitiveValueTypes[]) {
    super(field, value[0]); // Base class doesn't strictly support arrays but we override build
    this.arrayValue = new PrimitiveArrayValue(value);
  }

  build(option?: { startParamIndex?: number }) {
    const values = this.arrayValue.toValue();
    if (isEmpty(values)) return undefined;

    let index = option?.startParamIndex ?? 1;
    const placeholders = values.map(() => `$${index++}`).join(', ');

    return {
      sql: `${this.field} @> ARRAY[${placeholders}]`,
      params: values,
    };
  }
}
