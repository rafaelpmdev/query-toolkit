import { isEmpty } from '@raicampos/toolkit';
import { Clause, ParameterizedQuery } from './clause';

import { PrimitiveValueType } from '../../common/types/primitive-value';
import { SqlPrimitiveValue } from './sql-primitive-value';

export abstract class ClauseBase extends Clause {
  protected readonly value: SqlPrimitiveValue;

  constructor(
    protected readonly field: string,
    value: PrimitiveValueType
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.value = new SqlPrimitiveValue(value);
  }

  abstract build(option?: { startParamIndex?: number }): ParameterizedQuery | undefined;
}
