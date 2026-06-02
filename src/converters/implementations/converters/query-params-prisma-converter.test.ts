import { describe, expect, it } from 'vitest';
import {
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  LessThanOrEqualOperator,
  NotEqualsOperator,
} from '../../../query-operator';
import { QueryParamsPrismaConverter } from './query-params-prisma-converter';

describe('QueryParamsPrismaConverter', () => {
  it('should successfully convert a single operator to Prisma format', () => {
    const op = new EqualsOperator('==Espresso');
    const converter = new QueryParamsPrismaConverter({ name: op });

    const result = converter.build();
    expect(result).toEqual({ name: 'Espresso' });
  });

  it('should merge multiple object-based clauses for the same field', () => {
    const op1 = new GreaterThanOperator('gt=10');
    const op2 = new NotEqualsOperator('!=20'); // NotEquals dará um objeto { not: 20 }

    // Supondo que greater than crie { gt: 10 } e not equals crie { not: 20 }
    const converter = new QueryParamsPrismaConverter({ price: [op1, op2] });
    const result = converter.build();

    expect(result).toEqual({
      price: {
        gt: 10,
        not: 20,
      },
    });
  });

  it('should override with the last value if values are primitive and not object-based', () => {
    const op1 = new EqualsOperator('==val1');
    const op2 = new EqualsOperator('==val2');
    const converter = new QueryParamsPrismaConverter({ name: [op1, op2] });

    const result = converter.build();
    expect(result).toEqual({ name: 'val2' });
  });

  it('should return empty object when no operators are supplied', () => {
    const converter = new QueryParamsPrismaConverter({});
    const result = converter.build();
    expect(result).toEqual({});
  });

  it('should ignore nullish or undefined operators', () => {
    const converter = new QueryParamsPrismaConverter({
      name: undefined,
      origin: null as any,
    });
    const result = converter.build();
    expect(result).toEqual({});
  });

  it('should merge range operators (gte and lte) correctly for the same field', () => {
    const op1 = new GreaterThanOrEqualsOperator('gte=18');
    const op2 = new LessThanOrEqualOperator('lte=65');

    const converter = new QueryParamsPrismaConverter({ age: [op1, op2] });
    const result = converter.build();

    expect(result).toEqual({
      age: {
        gte: 18,
        lte: 65,
      },
    });
  });

  describe('sort()', () => {
    it('should convert a sort record into an array of Prisma orderBy objects', () => {
      const converter = new QueryParamsPrismaConverter({});
      const result = converter.sort({ name: 'asc', price: 'desc' });
      expect(result).toEqual([{ name: 'asc' }, { price: 'desc' }]);
    });

    it('should return undefined when sort is undefined', () => {
      const converter = new QueryParamsPrismaConverter({});
      expect(converter.sort(undefined)).toBeUndefined();
    });

    it('should return null when sort is null', () => {
      const converter = new QueryParamsPrismaConverter({});
      expect(converter.sort(null as any)).toBeNull();
    });
  });
});
