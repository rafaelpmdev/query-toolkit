import { isEmpty } from '@raicampos/toolkit';
import { ClauseBase } from '../core/clause-base';
import { SqlPrimitiveArrayValue } from '../core/sql-primitive-array-value';
import { PrimitiveValueType } from '../../common/types/primitive-value';

export class ClauseArrayContains extends ClauseBase {
  private readonly arrayValue: SqlPrimitiveArrayValue;

  constructor(field: string, value: PrimitiveValueType[]) {
    super(field, value[0]); // Base class doesn't strictly support arrays but we override build
    this.arrayValue = new SqlPrimitiveArrayValue(value);
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
