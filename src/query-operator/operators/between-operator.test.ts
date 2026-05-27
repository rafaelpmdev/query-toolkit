import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { BetweenOperator } from './between-operator';

describe('BetweenOperator', () => {
  it('should parse range values', () => {
    const operator = new BetweenOperator('btw=1,10');
    expect(operator.value()).toEqual([1, 10]);
  });

  it('should parse date range values', () => {
    const operator = new BetweenOperator('btw=2024-01-01,2024-01-31');
    const [start, end] = operator.value() as Date[];
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(start.toISOString()).toContain('2024-01-01');
    expect(end.toISOString()).toContain('2024-01-31');
  });

  it('should return query object', () => {
    const operator = new BetweenOperator('btw=10,20');
    expect(operator.query()).toEqual({ gte: 10, lte: 20 });
  });

  it('should accept visitor', () => {
    const operator = new BetweenOperator('btw=1,10');
    const visitor = {
      visitBetween: vi.fn().mockReturnValue('visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'field');
    expect(visitor.visitBetween).toHaveBeenCalledWith(operator, 'field');
    expect(result).toBe('visited');
  });
});
