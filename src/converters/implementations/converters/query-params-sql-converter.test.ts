import { describe, expect, it } from 'vitest';
import { EqualsOperator, GreaterThanOperator, NotEqualsOperator } from '../../../query-operator';
import { QueryParamsSqlConverter } from './query-params-sql-converter';

describe('QueryParamsSqlConverter', () => {
  it('should convert a single operator to SQL clauses map', () => {
    const op = new EqualsOperator('==Espresso');
    const converter = new QueryParamsSqlConverter({ name: op });

    const result = converter.build();
    expect(result.name).toBeDefined();
    expect(result.name).toHaveLength(1);

    const clause = result.name![0]!;
    const built = clause.build()!;
    expect(built.sql).toContain('name =');
    expect(built.params).toEqual(['Espresso']);
  });

  it('should convert multiple operators for the same field', () => {
    const op1 = new GreaterThanOperator('gt=10');
    const op2 = new NotEqualsOperator('!=20');
    const converter = new QueryParamsSqlConverter({ price: [op1, op2] });

    const result = converter.build();
    expect(result.price).toBeDefined();
    expect(result.price).toHaveLength(2);

    const built1 = result.price![0]!.build()!;
    const built2 = result.price![1]!.build()!;

    expect(built1.sql).toContain('price >');
    expect(built1.params).toEqual([10]);
    expect(built2.sql).toContain('price <>');
    expect(built2.params).toEqual([20]);
  });

  it('should return empty object when no operators are provided', () => {
    const converter = new QueryParamsSqlConverter({});
    const result = converter.build();
    expect(result).toEqual({});
  });

  it('should ignore null or undefined operators', () => {
    const converter = new QueryParamsSqlConverter({
      name: undefined,
      origin: null as any,
    });
    const result = converter.build();
    expect(result).toEqual({});
  });
});
