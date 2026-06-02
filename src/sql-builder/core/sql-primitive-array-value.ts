import { isAssigned, Nullable } from '@raicampos/toolkit';
import { PrimitiveValueType } from '../../common/types/primitive-value';
import { SqlPrimitiveValue } from './sql-primitive-value';
import { TransformFunction } from './transform-function';

export class SqlPrimitiveArrayValue {
  private readonly value: Array<SqlPrimitiveValue>;

  constructor(values: Array<Nullable<PrimitiveValueType>>, valueTransform?: TransformFunction) {
    const assignedValues = values.filter((item) => isAssigned(item));
    this.value = assignedValues.map((item) => new SqlPrimitiveValue(item, valueTransform));
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

  toValue(): Nullable<PrimitiveValueType>[] {
    if (this.isEmpty) {
      return [];
    }
    return this.value.map((value) => value.toValue());
  }
}
