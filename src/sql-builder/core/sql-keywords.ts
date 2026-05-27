/**
 * SQL Keywords and Operators
 * Centralized constants for SQL syntax to improve maintainability
 * and enable future support for different SQL dialects
 */

export const SQL_OPERATORS = {
  EQUALS: '=',
  NOT_EQUALS: '<>',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUALS: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUALS: '<=',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  IN: 'IN',
  NOT_IN: 'NOT IN',
  BETWEEN: 'BETWEEN',
} as const;

export const SQL_KEYWORDS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  WHERE: 'WHERE',
  ORDER_BY: 'ORDER BY',
  GROUP_BY: 'GROUP BY',
  LIMIT: 'LIMIT',
  OFFSET: 'OFFSET',
  EXISTS: 'EXISTS',
  ASC: 'ASC',
  DESC: 'DESC',
  JOIN: 'JOIN',
  LEFT_JOIN: 'LEFT JOIN',
  RIGHT_JOIN: 'RIGHT JOIN',
  FULL_JOIN: 'FULL OUTER JOIN',
  ON: 'ON',
} as const;

export const SQL_ARRAY_OPERATORS = {
  CONTAINS: '@>',
  IS_CONTAINED_BY: '<@',
  OVERLAP: '&&',
} as const;

export type SqlOperator = (typeof SQL_OPERATORS)[keyof typeof SQL_OPERATORS];
export type SqlKeyword = (typeof SQL_KEYWORDS)[keyof typeof SQL_KEYWORDS];
export type SqlArrayOperator = (typeof SQL_ARRAY_OPERATORS)[keyof typeof SQL_ARRAY_OPERATORS];
