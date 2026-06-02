import { isNullOrUndefined } from '@raicampos/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveValueType } from '../../common/types/primitive-value';

export class ClauseLessThanOrEquals extends ClauseBase {
  constructor(field: string, value: PrimitiveValueType) {
    super(field, value);
  }

  build(option?: { startParamIndex?: number }) {
    if (!(this.value.isNumber() || this.value.isDate())) return undefined;
    const value = this.value.toValue();
    if (isNullOrUndefined(value)) return undefined;

    const index = option?.startParamIndex ?? 1;
    return {
      sql: `${this.field} <= $${index}`,
      params: [value],
    };
  }
}
