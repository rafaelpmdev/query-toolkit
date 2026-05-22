import { Nullable } from '@raicamposs/toolkit';
import { PrimitiveValueTypes } from './primitive-value';
import { TransformFunction } from './transform-function';
/**
 * Represents a SQL query with its parameters separated.
 */
export interface ParameterizedQuery {
  /** The SQL string with placeholders (e.g., $1, $2) */
  sql: string;
  /** The values corresponding to the placeholders */
  params: Nullable<PrimitiveValueTypes>[];
}

/**
 * Base class for all SQL clauses (WHERE, etc.).
 */
export abstract class Clause {
  /**
   * Builds the clause in a parameterized format.
   * @param option Configuration options, such as the starting index for parameters.
   */
  abstract build(option?: { startParamIndex?: number }): ParameterizedQuery | undefined;

  protected valueTransform: TransformFunction | undefined;

  /**
   * Applies a transformation function to difference the value before building the SQL.
   * @param transform The transformation function.
   */
  withValueTransform(transform?: TransformFunction) {
    this.valueTransform = transform;
    return this;
  }
}
