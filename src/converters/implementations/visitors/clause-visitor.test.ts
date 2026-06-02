import { describe, expect, it, vi } from 'vitest';
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
} from '../../../query-operator';
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
} from '../../../sql-builder/implementations';
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
    const op = new InOperator('in=v1,v2');
    const result = visitor.visitIn(op, 'field');
    expect(result).toBeInstanceOf(ClauseIn);
  });

  it('should visit not in', () => {
    const op = new NotInOperator('out=v1,v2');
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
      'Invalid value for Between operator on field "field". Expected an object with gte and lte.'
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

  it('should wrap a single non-array value from visitIn into an array', () => {
    const op = new InOperator('in=v1');
    vi.spyOn(op, 'value').mockReturnValue('single-value' as any);
    const result = visitor.visitIn(op, 'field');
    expect(result).toBeInstanceOf(ClauseIn);
    expect(result.build()?.sql).toContain('field IN');
  });

  it('should wrap a single non-array value from visitNotIn into an array', () => {
    const op = new NotInOperator('out=v1');
    vi.spyOn(op, 'value').mockReturnValue('single-value' as any);
    const result = visitor.visitNotIn(op, 'field');
    expect(result).toBeInstanceOf(ClauseNotIn);
  });

  it('should wrap a single non-array value from visitArrayContains into an array', () => {
    const op = new ArrayContainsOperator('@>tag1');
    vi.spyOn(op, 'value').mockReturnValue('tag1' as any);
    const result = visitor.visitArrayContains(op, 'tags');
    expect(result).toBeInstanceOf(ClauseArrayContains);
  });

  it('should wrap a single non-array value from visitArrayIsContainedBy into an array', () => {
    const op = new ArrayIsContainedByOperator('<@tag1');
    vi.spyOn(op, 'value').mockReturnValue('tag1' as any);
    const result = visitor.visitArrayIsContainedBy(op, 'tags');
    expect(result).toBeInstanceOf(ClauseArrayIsContainedBy);
  });

  it('should wrap a single non-array value from visitArrayOverlap into an array', () => {
    const op = new ArrayOverlapOperator('&&tag1');
    vi.spyOn(op, 'value').mockReturnValue('tag1' as any);
    const result = visitor.visitArrayOverlap(op, 'tags');
    expect(result).toBeInstanceOf(ClauseArrayOverlap);
  });
});
