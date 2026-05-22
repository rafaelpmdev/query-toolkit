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
import {
  ClauseArrayContains,
  ClauseArrayIsContainedBy,
  ClauseArrayOverlap,
  ClauseBetween,
  ClauseEquals,
  ClauseEmpty,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseNotEquals,
  ClauseNotILike,
  ClauseNotIn,
} from '../sql-builder/implementations';
import { ClauseVisitor } from './clause-visitor';

describe('ClauseVisitor', () => {
  const visitor = new ClauseVisitor();

  it('should visit equals', () => {
    const op = new EqualsOperator('eq=val');
    const result = visitor.visitEquals(op, 'field');
    expect(result).toBeInstanceOf(ClauseEquals);
  });

  it('should visit not equals', () => {
    const op = new NotEqualsOperator('neq=val');
    const result = visitor.visitNotEquals(op, 'field');
    expect(result).toBeInstanceOf(ClauseNotEquals);
  });

  it('should visit in', () => {
    const op = new InOperator(['v1', 'v2']);
    const result = visitor.visitIn(op, 'field');
    expect(result).toBeInstanceOf(ClauseIn);
  });

  it('should visit not in', () => {
    const op = new NotInOperator(['v1', 'v2']);
    const result = visitor.visitNotIn(op, 'field');
    expect(result).toBeInstanceOf(ClauseNotIn);
  });

  it('should visit greater than', () => {
    const op = new GreaterThanOperator('gt=10');
    const result = visitor.visitGreaterThan(op, 'field');
    expect(result).toBeInstanceOf(ClauseGreaterThan);
  });

  it('should visit greater than or equals', () => {
    const op = new GreaterThanOrEqualsOperator('gte=10');
    const result = visitor.visitGreaterThanOrEquals(op, 'field');
    expect(result).toBeInstanceOf(ClauseGreaterThanOrEquals);
  });

  it('should visit less than', () => {
    const op = new LessThanOperator('lt=10');
    const result = visitor.visitLessThan(op, 'field');
    expect(result).toBeInstanceOf(ClauseLessThan);
  });

  it('should visit less than or equals', () => {
    const op = new LessThanOrEqualOperator('lte=10');
    const result = visitor.visitLessThanOrEquals(op, 'field');
    expect(result).toBeInstanceOf(ClauseLessThanOrEquals);
  });

  it('should visit contains', () => {
    const op = new ContainsOperator('lk=*val*');
    const result = visitor.visitContains(op, 'field');
    expect(result).toBeInstanceOf(ClauseILike);
  });

  it('should visit not contains', () => {
    const op = new NotContainsOperator('nlk=*val*');
    const result = visitor.visitNotContains(op, 'field');
    expect(result).toBeInstanceOf(ClauseNotILike);
  });

  it('should visit between', () => {
    const op = new BetweenOperator('btw=1,10');
    const result = visitor.visitBetween(op, 'field');
    expect(result).toBeInstanceOf(ClauseBetween);
  });

  it('should throw error when visiting between with invalid value format', () => {
    const op = new BetweenOperator('btw=1');
    expect(() => visitor.visitBetween(op, 'field')).toThrow(
      'Invalid value for Between operator on field "field". Expected an array with 2 elements.'
    );
  });

  it('should visit array contains', () => {
    const op = new ArrayContainsOperator('ctn=[v1,v2]');
    const result = visitor.visitArrayContains(op, 'field');
    expect(result).toBeInstanceOf(ClauseArrayContains);
  });

  it('should visit array is contained by', () => {
    const op = new ArrayIsContainedByOperator('itb=[v1,v2]');
    const result = visitor.visitArrayIsContainedBy(op, 'field');
    expect(result).toBeInstanceOf(ClauseArrayIsContainedBy);
  });

  it('should visit array overlap', () => {
    const op = new ArrayOverlapOperator('ovp=[v1,v2]');
    const result = visitor.visitArrayOverlap(op, 'field');
    expect(result).toBeInstanceOf(ClauseArrayOverlap);
  });

  it('should visit unknown', () => {
    const op = new UnknownOperator('val');
    const result = visitor.visitUnknown(op, 'field');
    expect(result).toBeInstanceOf(ClauseEquals);
  });

  it('should visit unknown with null value and return ClauseEmpty', () => {
    const op = new UnknownOperator('');
    vi.spyOn(op, 'value').mockReturnValue(null as any);
    const result = visitor.visitUnknown(op, 'field');
    expect(result).toBeInstanceOf(ClauseEmpty);
  });
});
