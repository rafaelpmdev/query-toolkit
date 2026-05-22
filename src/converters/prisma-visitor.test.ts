import { describe, expect, it, vi } from 'vitest';
import { ArrayContainsOperator } from '../query-operator/array-contains-operator';
import { ArrayIsContainedByOperator } from '../query-operator/array-is-contained-by-operator';
import { ArrayOverlapOperator } from '../query-operator/array-overlap-operator';
import { BetweenOperator } from '../query-operator/between-operator';
import { ContainsOperator } from '../query-operator/contains-operator';
import { EqualsOperator } from '../query-operator/equals-operator';
import { GreaterThanOperator } from '../query-operator/greater-than-operator';
import { GreaterThanOrEqualsOperator } from '../query-operator/greater-than-or-equals-operator';
import { InOperator } from '../query-operator/in-operator';
import { LessThanOperator } from '../query-operator/less-than-operator';
import { LessThanOrEqualOperator } from '../query-operator/less-than-or-equals-operator';
import { NotContainsOperator } from '../query-operator/not-contains-operator';
import { NotEqualsOperator } from '../query-operator/not-equals-operator';
import { NotInOperator } from '../query-operator/not-in-operator';
import { UnknownOperator } from '../query-operator/unknown-operator';
import { PrismaVisitor } from './prisma-visitor';

describe('PrismaVisitor', () => {
  const visitor = new PrismaVisitor();

  it('should visit equals', () => {
    const op = new EqualsOperator('==val');
    expect(visitor.visitEquals(op, 'field')).toEqual({ field: 'val' });
  });

  it('should visit not equals', () => {
    const op = new NotEqualsOperator('!=val');
    expect(visitor.visitNotEquals(op, 'field')).toEqual({ field: { not: 'val' } });
  });

  it('should visit in', () => {
    const op = new InOperator(['v1', 'v2']);
    expect(visitor.visitIn(op, 'field')).toEqual({ field: { in: ['v1', 'v2'] } });
  });

  it('should visit notIn', () => {
    const op = new NotInOperator(['v1', 'v2']);
    expect(visitor.visitNotIn(op, 'field')).toEqual({ field: { notIn: ['v1', 'v2'] } });
  });

  it('should visit greater than', () => {
    const op = new GreaterThanOperator('gt=10');
    expect(visitor.visitGreaterThan(op, 'field')).toEqual({ field: { gt: 10 } });
  });

  it('should visit greater than or equals', () => {
    const op = new GreaterThanOrEqualsOperator('gte=10');
    expect(visitor.visitGreaterThanOrEquals(op, 'field')).toEqual({ field: { gte: 10 } });
  });

  it('should visit less than', () => {
    const op = new LessThanOperator('lt=10');
    expect(visitor.visitLessThan(op, 'field')).toEqual({ field: { lt: 10 } });
  });

  it('should visit less than or equals', () => {
    const op = new LessThanOrEqualOperator('lte=10');
    expect(visitor.visitLessThanOrEquals(op, 'field')).toEqual({ field: { lte: 10 } });
  });

  it('should visit contains', () => {
    const op = new ContainsOperator('~=val');
    expect(visitor.visitContains(op, 'field')).toEqual({
      field: { contains: 'val', mode: 'insensitive' },
    });
  });

  it('should visit not contains', () => {
    const op = new NotContainsOperator('!~=val');
    expect(visitor.visitNotContains(op, 'field')).toEqual({
      field: { not: { contains: 'val', mode: 'insensitive' } },
    });
  });

  it('should visit between', () => {
    const op = new BetweenOperator('btw=1,10');
    expect(visitor.visitBetween(op, 'field')).toEqual({
      field: { gte: 1, lte: 10 },
    });
  });

  it('should visit array contains', () => {
    const op = new ArrayContainsOperator('@>v1,v2');
    expect(visitor.visitArrayContains(op, 'field')).toEqual({
      field: { hasEvery: ['v1', 'v2'] },
    });
  });

  it('should visit array overlap', () => {
    const op = new ArrayOverlapOperator('&&v1,v2');
    expect(visitor.visitArrayOverlap(op, 'field')).toEqual({
      field: { hasSome: ['v1', 'v2'] },
    });
  });

  it('should visit unknown', () => {
    const op = new UnknownOperator('val');
    expect(visitor.visitUnknown(op, 'field')).toEqual({ field: 'val' });
  });

  it('should visit array is contained by and throw error', () => {
    const op = new ArrayIsContainedByOperator('itb=[v1,v2]');
    expect(() => visitor.visitArrayIsContainedBy(op, 'field')).toThrow(
      'The "is contained by" array operator is not natively supported by Prisma on field "field". Use raw query execution instead.'
    );
  });

  it('should handle single value in array contains', () => {
    const op = new ArrayContainsOperator('@>v1');
    vi.spyOn(op, 'value').mockReturnValue('v1' as any);
    expect(visitor.visitArrayContains(op, 'field')).toEqual({
      field: { has: 'v1' },
    });
  });

  it('should handle single value in array overlap', () => {
    const op = new ArrayOverlapOperator('&&v1');
    vi.spyOn(op, 'value').mockReturnValue('v1' as any);
    expect(visitor.visitArrayOverlap(op, 'field')).toEqual({
      field: { has: 'v1' },
    });
  });

  it('should handle single value in between and throw validation error', () => {
    const op = new BetweenOperator('btw=1,10');
    vi.spyOn(op, 'value').mockReturnValue(1 as any);
    expect(() => visitor.visitBetween(op, 'field')).toThrow(
      'Invalid value for Between operator on field "field". Expected an array with 2 elements.'
    );
  });

  it('should visit unknown with null value', () => {
    const op = new UnknownOperator('val');
    vi.spyOn(op, 'value').mockReturnValue(null as any);
    expect(visitor.visitUnknown(op, 'field')).toEqual({});
  });
});
