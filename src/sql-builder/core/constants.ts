/**
 * SQL Builder Constants
 * Magic numbers and configuration values
 */

export const SQL_BUILDER_CONSTANTS = {
  /** Indicates no limit is set */
  NO_LIMIT: 0,

  /** Indicates no offset is set */
  NO_OFFSET: 0,

  /** Default limit for pagination */
  DEFAULT_LIMIT: 10,

  /** Maximum allowed limit to prevent excessive queries */
  MAX_LIMIT: 1000,

  /** Maximum number of WHERE clauses allowed */
  MAX_WHERE_CLAUSES: 50,

  /** Maximum number of ORDER BY clauses allowed */
  MAX_ORDER_BY_CLAUSES: 10,

  /** Maximum number of GROUP BY clauses allowed */
  MAX_GROUP_BY_CLAUSES: 10,

  /** Maximum number of JOINs allowed */
  MAX_JOINS: 8,
} as const;

export const PRIMITIVE_VALUE_CONSTANTS = {
  /** Maximum error message length for display */
  MAX_ERROR_LENGTH: 50,
} as const;

export type SqlBuilderConstants = typeof SQL_BUILDER_CONSTANTS;
export type PrimitiveValueConstants = typeof PRIMITIVE_VALUE_CONSTANTS;
