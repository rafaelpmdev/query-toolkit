import { isEmpty } from '@raicampos/toolkit';
import { Clause, ParameterizedQuery } from './clause';

import { PrimitiveValue, PrimitiveValueTypes } from './primitive-value';

export abstract class ClauseBase extends Clause {
  protected readonly value: PrimitiveValue;

  constructor(
    protected readonly field: string,
    value: PrimitiveValueTypes
  ) {
    super();
    if (isEmpty(this.field)) {
      throw new Error('Field is required');
    }
    this.value = new PrimitiveValue(value);
  }

  abstract build(option?: { startParamIndex?: number }): ParameterizedQuery | undefined;
}
