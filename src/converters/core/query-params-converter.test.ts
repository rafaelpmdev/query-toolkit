import { describe, expect, it } from 'vitest';
import {
  ArrayContainsOperator,
  ArrayIsContainedByOperator,
  ArrayOverlapOperator,
  BetweenOperator,
  ContainsOperator,
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  InOperator,
  LessThanOperator,
  LessThanOrEqualOperator,
  NotContainsOperator,
  NotEqualsOperator,
  NotInOperator,
  UnknownOperator,
} from '../../query-operator';
import { PrismaVisitor } from '../implementations/visitors/prisma-visitor';
import { QueryParamsConverter } from './query-params-converter';

describe('QueryParamsConverter', () => {
  it('should convert to arbitrary format using visitor', () => {
    const op = new EqualsOperator('==val');
    const converter = new QueryParamsConverter({ name: op });

    const visitor = new PrismaVisitor();
    const result = converter.to(visitor);

    expect(result).toEqual({ name: [{ name: 'val' }] });
  });

  it('should ignore values that are not instances of QueryParamsOperator', () => {
    const op = new EqualsOperator('==val');
    const converter = new QueryParamsConverter({
      name: op,
      limit: 10 as any,
      offset: 0 as any,
      sort: 'name:asc' as any,
    });

    const visitor = new PrismaVisitor();
    const result = converter.to(visitor);

    expect(result.name).toHaveLength(1);
    expect(result.limit).toBeUndefined();
    expect(result.offset).toBeUndefined();
    expect(result.sort).toBeUndefined();
  });
});
