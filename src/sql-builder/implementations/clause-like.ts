import { isNullOrUndefined } from '@raicamposs/toolkit';
import { ClauseBase } from '../core/clause-base';

export class ClauseLike extends ClauseBase {
  constructor(field: string, value: string) {
    super(field, value);
  }

  build(option?: { startParamIndex?: number }) {
    const value = this.value.toValue();
    if (isNullOrUndefined(value)) return undefined;
    if (!this.value.isString()) return undefined;

    const index = option?.startParamIndex ?? 1;
    return {
      sql: `${this.field} LIKE $${index}`,
      params: [value],
    };
  }
}
