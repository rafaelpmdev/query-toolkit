import { isEmpty } from '@raicampos/toolkit';
import { Clause } from '../core/clause';
import { SqlPrimitiveArrayValue } from '../core/sql-primitive-array-value';
import { PrimitiveValueType } from '../../common/types/primitive-value';

export class ClauseIn extends Clause {
  private readonly compareFields: SqlPrimitiveArrayValue;
  constructor(
    private readonly field: string,
    compareFields: PrimitiveValueType[]
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.compareFields = new SqlPrimitiveArrayValue(compareFields);
  }

  build(option?: { startParamIndex?: number }) {
    const values = this.compareFields.toValue();
    if (isEmpty(values)) return undefined;

    let index = option?.startParamIndex ?? 1;
    const placeholders = values.map(() => `$${index++}`).join(', ');

    return {
      sql: `${this.field} IN (${placeholders})`,
      params: values,
    };
  }
}
