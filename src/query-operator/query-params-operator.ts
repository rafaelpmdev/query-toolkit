import { isAssigned, isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import { OperatorSymbolType } from '../common/types/operator-symbol';
import type { OperatorVisitor } from '../converters';

export type QueryParamsOperatorSuccess<ValueType> = {
  success: true;
  value: ValueType;
};

export type QueryParamsOperatorError = {
  success: false;
  error: string;
};

export type QueryParamsOperatorSafeParse<ValueType> =
  | QueryParamsOperatorSuccess<ValueType>
  | QueryParamsOperatorError;

export abstract class QueryParamsOperator<Condition, ValueType> {
  constructor(
    public readonly symbol: OperatorSymbolType | '',
    public readonly params: string
  ) {}

  abstract safeParse(): QueryParamsOperatorSafeParse<ValueType>;
  abstract value(): Nullable<ValueType>;
  abstract query(): Nullable<Condition>;

  /**
   * Accept a visitor to convert this operator to a specific format
   * @template T - The return type of the visitor
   * @param visitor - The visitor implementation
   * @param field - The field name this operator applies to
   */
  abstract accept<T>(visitor: OperatorVisitor<T>, field: string): T;

  protected getRawValue(): string {
    if (!this.params.startsWith(this.symbol)) {
      return this.params;
    }
    return this.params.substring(this.symbol.length).trim();
  }

  isValid(): this is QueryParamsOperatorSuccess<ValueType> {
    return this.safeParse().success;
  }

  isInvalid(): this is QueryParamsOperatorError {
    return !this.safeParse().success;
  }

  isAssigned() {
    return isAssigned(this.value());
  }

  isNullOrUndefined() {
    return isNullOrUndefined(this.value());
  }

  isArray() {
    const value = this.value();
    if (isNullOrUndefined(value)) {
      return false;
    }
    return Array.isArray(value);
  }
}
