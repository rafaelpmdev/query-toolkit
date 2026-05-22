import { isAssigned, Nullable } from '@raicamposs/toolkit';
import { PrimitiveValue, PrimitiveValueTypes } from './primitive-value';
import { TransformFunction } from './transform-function';

export class PrimitiveArrayValue {
  private readonly value: Array<PrimitiveValue>;

  constructor(values: Array<Nullable<PrimitiveValueTypes>>, valueTransform?: TransformFunction) {
    const assignedValues = values.filter((item) => isAssigned(item));
    this.value = assignedValues.map((item) => new PrimitiveValue(item, valueTransform));
  }

  get isEmpty(): boolean {
    return this.value.length === 0;
  }

  toSql(): string | undefined {
    if (this.isEmpty) {
      return undefined;
    }

    return `${this.value.map((value) => value.toSql()).join(', ')}`;
  }

  toValue(): Nullable<PrimitiveValueTypes>[] {
    if (this.isEmpty) {
      return [];
    }
    return this.value.map((value) => value.toValue());
  }
}
