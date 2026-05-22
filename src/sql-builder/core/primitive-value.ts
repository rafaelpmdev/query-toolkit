import { isAssigned, isNullOrUndefined, Nullable } from '@raicamposs/toolkit';
import { SqlInjectionDetector } from '../../common/sql-injection-detector';
import { TransformFunction } from './transform-function';

export type PrimitiveValueTypes = string | boolean | number | Date;

/**
 * Converts primitive values to SQL-safe strings with SQL injection protection
 *
 * Security measures:
 * - Escapes single quotes by doubling them (SQL standard)
 * - Escapes backslashes to prevent escape sequence attacks
 * - Removes null bytes that could truncate queries
 * - Validates numbers to prevent NaN/Infinity injection
 * - Detects dangerous SQL patterns via SqlInjectionDetector
 *
 * @example
 * new PrimitiveValue("O'Brien").toSql() // Returns: 'O''Brien'
 * new PrimitiveValue(123).toSql()       // Returns: 123
 */
export class PrimitiveValue {
  // SQL Injection Protection Patterns
  private static readonly QUOTE_REGEX = /'/g;
  private static readonly BACKSLASH_REGEX = /\\/g;
  private static readonly NULL_BYTE_REGEX = /\0/g;

  constructor(
    private readonly value: Nullable<PrimitiveValueTypes>,
    private readonly valueTransform?: TransformFunction
  ) {}

  /**
   * Converts the value to a SQL-safe string with injection protection
   * @returns SQL-formatted string or undefined if value is null/undefined
   */
  toSql(): string | undefined {
    if (isNullOrUndefined(this.value)) {
      return undefined;
    }

    let value = this.value;

    if (isAssigned(this.valueTransform)) {
      value = this.valueTransform(this.value);
    }

    if (isNullOrUndefined(value)) {
      return undefined;
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (typeof value === 'string') {
      return this.formatString(value);
    }

    if (typeof value === 'boolean') {
      return this.formatBoolean(value);
    }

    // number
    return this.formatNumber(value);
  }

  /**
   * Returns the raw value
   * @returns The raw value
   */
  getValue(): Nullable<PrimitiveValueTypes> {
    return this.value;
  }

  /**
   * Returns the value for parameterized query binding.
   * Dates are returned as Date objects, other primitives are returned as is.
   */
  toValue(): Nullable<PrimitiveValueTypes> {
    if (isNullOrUndefined(this.value)) {
      return null;
    }

    if (isAssigned(this.valueTransform)) {
      return this.valueTransform(this.value);
    }

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
    if (this.value instanceof Date) return true;
    if (typeof this.value === 'string') return !isNaN(Date.parse(this.value));
    return false;
  }

  /**
   * Formats a Date object to SQL date string format (DD/MM/YYYY)
   * Date objects are inherently safe from SQL injection
   */
  private formatDate(date: Date): string {
    return `'${date.toISOString()}'`;
  }

  /**
   * Formats a string value with comprehensive SQL injection protection
   *
   * Protection layers:
   * 1. Removes null bytes (\0) that could truncate queries
   * 2. Escapes backslashes to prevent escape sequence attacks
   * 3. Escapes single quotes by doubling them (SQL standard)
   * 4. Detects dangerous SQL patterns (logs warning via SqlInjectionDetector)
   * 5. Wraps value in single quotes
   *
   * @param str - String to format
   * @returns SQL-safe quoted string
   */
  private formatString(str: string): string | undefined {
    if (SqlInjectionDetector.detect(str)) {
      throw new Error(`Invalid string value: ${str}. SQL injection detected.`);
    }

    const sanitized = str
      .replace(PrimitiveValue.NULL_BYTE_REGEX, '')
      .replace(PrimitiveValue.BACKSLASH_REGEX, '\\\\')
      .replace(PrimitiveValue.QUOTE_REGEX, "''");

    if (SqlInjectionDetector.detect(sanitized)) {
      throw new Error(`Invalid string value: ${sanitized}. SQL injection detected.`);
    }

    return `'${sanitized}'`;
  }

  /**
   * Formats a number with validation to prevent NaN/Infinity injection
   *
   * @param num - Number to format
   * @returns String representation of the number
   * @throws Error if number is NaN or Infinity
   */
  private formatNumber(num: number): string {
    // Prevent NaN and Infinity from being injected
    if (!Number.isFinite(num)) {
      throw new Error(
        `Invalid number value: ${num}. NaN and Infinity are not allowed in SQL queries.`
      );
    }

    return num.toString();
  }

  /**
   * Formats a boolean value to SQL boolean representation
   * Booleans are inherently safe from SQL injection
   */
  private formatBoolean(value: boolean): string {
    return value.toString();
  }
}
