import { ValueOf } from '@raicampos/toolkit';

// Equality (==) : equals
// Inequality (!=) : not equals
// Ilike (~=) : ilike in sentence
// Ilike number string (+=) : ilike factor number in sentence
// NotLike (!~=) : not like in sentence
// In (in=) : in
// NotIn (out=) : notIn
// Greater than (gt=) : gt
// Greater than or equal to (gte) : gte
// Less than (lt=) : lt
// Less than or equal to (lte=) : lte
// Between (btw=) : btw

export const OperatorSymbol = {
  equals: '==',
  notEquals: '!=',
  contains: '~=',
  notContains: '!~=',
  in: 'in=',
  notIn: 'out=',
  greaterThan: 'gt=',
  greaterThanOrEqual: 'gte=',
  lessThan: 'lt=',
  lessThanOrEqual: 'lte=',
  between: 'btw=',
  arrayIsContainedBy: '<@',
  arrayContains: '@>',
  arrayOverlap: '&&',
} as const;

export type OperatorSymbolType = ValueOf<typeof OperatorSymbol>;

export const OPERATORS = Object.values(OperatorSymbol);
