import { isNullOrUndefined } from '@raicampos/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseLessThan extends ClauseBase {
  constructor(field: string, value: PrimitiveValueTypes) {
    super(field, value);
  }

  build(option?: { startParamIndex?: number }) {
    if (!(this.value.isNumber() || this.value.isDate())) return undefined;

    const value = this.value.toValue();

    if (isNullOrUndefined(value)) return undefined;

    const index = option?.startParamIndex ?? 1;
    return {
      sql: `${this.field} < $${index}`,
      params: [value],
    };
  }
}
