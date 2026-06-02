import { isNullOrUndefined } from '@raicampos/toolkit';
import { ClauseBase } from '../core/clause-base';
import { PrimitiveValueType } from '../../common/types/primitive-value';

export class ClauseNotILike extends ClauseBase {
  constructor(field: string, value: PrimitiveValueType) {
    super(field, value);
  }

  build(option?: { startParamIndex?: number }) {
    const raw = this.value.toValue();
    if (isNullOrUndefined(raw)) return undefined;
    const index = option?.startParamIndex ?? 1;
    return {
      sql: `${this.field} NOT ILIKE $${index}`,
      params: [raw],
    };
  }
}
