import { isAssigned, isNullOrUndefined, Nullable } from '@raicampos/toolkit';

const DATE_RSQL_REGEX =
  /^([12][0-9]{3})-((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01])|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|1[0-9]|2[0-9])))\s?(\d{2}:\d{2}:\d{2}(\.\d{3})?)?$/;

// FLOAT_NUMBER_REGEX já cobre números inteiros graças ao (\.\d+)? opcional, incluindo notação científica opcional.
const NUMBER_REGEX = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

export type PrimitiveValueType = string | boolean | number | Date;

type PrimitiveValueMap = {
  number: number;
  string: string;
  boolean: boolean;
  date: Date;
};

export class PrimitiveValue {
  constructor(private readonly value: PrimitiveValueType | null | undefined) {}

  static converter(value: string): PrimitiveValue {
    if (isNullOrUndefined(value)) return new PrimitiveValue(null);

    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true') return new PrimitiveValue(true);
    if (lowerValue === 'false') return new PrimitiveValue(false);

    if (NUMBER_REGEX.test(value)) {
      const num = Number(value);
      if (!isNaN(num)) return new PrimitiveValue(num);
    }

    if (DATE_RSQL_REGEX.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return new PrimitiveValue(date);
    }

    return new PrimitiveValue(value);
  }

  static converterArray(value: string): PrimitiveValue[] {
    if (isNullOrUndefined(value)) return [];

    // Remove os parênteses externos do formato RSQL: (v1,v2) → v1,v2
    const normalized = value.trim().replace(/^\(/, '').replace(/\)$/, '');

    return normalized
      .split(',')
      .map((item) => item.trim())
      .map((item) => item.replace(/^["']|["']$/g, '')) // Remove aspas simples ou duplas
      .filter((item) => item !== '')
      .map((item) => PrimitiveValue.converter(item))
      .filter((item) => isAssigned(item.getValue()));
  }

  static value(value: string): PrimitiveValueType {
    return PrimitiveValue.converter(value).getValue() ?? '';
  }

  static values(value: string): PrimitiveValueType[] {
    return PrimitiveValue.converterArray(value)
      .map((item) => item.getValue())
      .filter((val): val is PrimitiveValueType => isAssigned(val));
  }

  getValue(): Nullable<PrimitiveValueType> {
    return this.value;
  }

  isDate(): boolean {
    return this.value instanceof Date;
  }

  isString(): boolean {
    return typeof this.value === 'string';
  }

  isBoolean(): boolean {
    return typeof this.value === 'boolean';
  }

  isNumber(): boolean {
    return typeof this.value === 'number';
  }

  isValidDate(): boolean {
    return this.isDate();
  }

  asDate(): Nullable<Date> {
    if (this.isDate()) return this.value as Date;
    return null;
  }

  asNumber(): Nullable<number> {
    if (this.isNumber() && !isNaN(this.value as number)) return this.value as number;
    return null;
  }

  asString(): Nullable<string> {
    if (this.isString()) return this.value as string;
    return null;
  }

  asBoolean(): Nullable<boolean> {
    if (this.isBoolean()) return this.value as boolean;
    return null;
  }

  asNumericOrDate(): Nullable<number | Date> {
    if (this.isNumber()) return this.value as number;
    if (this.isDate()) return this.value as Date;
    return null;
  }

  asType<K extends keyof PrimitiveValueMap>(type: K): Nullable<PrimitiveValueMap[K]> {
    if (!isAssigned(this.value)) {
      return null;
    }

    if (type === 'date' && this.isDate()) {
      return this.value as PrimitiveValueMap[K];
    }

    if (typeof this.value === type) {
      return this.value as PrimitiveValueMap[K];
    }

    return null;
  }
}
