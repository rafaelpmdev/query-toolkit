import { ValueOf } from '@raicampos/toolkit';

export const OperatorSymbol = {
  equals: '==',
  notEquals: '!=',
  ilike: '~=',
  ilikeNumberString: '+=',
  notLike: '!~=',
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
