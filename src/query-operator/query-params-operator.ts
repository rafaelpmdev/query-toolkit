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

import { Nullable } from '@raicampos/toolkit';
import type { OperatorVisitor } from '../converters';
import { PrimitiveValueTypes } from '../sql-builder/core';
import { RsqlCondition } from '../types';
import { OperatorSymbolType } from '../types/operator-symbol';

export abstract class QueryParamsOperator {
  constructor(
    public readonly symbol: OperatorSymbolType | '',
    public readonly params: string
  ) {}

  abstract value(): PrimitiveValueTypes | PrimitiveValueTypes[];
  abstract query(): Nullable<RsqlCondition>;

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
}
