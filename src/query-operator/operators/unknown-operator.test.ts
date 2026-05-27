import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { UnknownOperator } from './unknown-operator';

describe('UnknownOperator', () => {
  it('should parse string value', () => {
    const operator = new UnknownOperator('value');
    expect(operator.value()).toBe('value');
  });

  it('should parse number value', () => {
    const operator = new UnknownOperator('123');
    expect(operator.value()).toBe(123);
  });

  it('should return query object with equals', () => {
    const operator = new UnknownOperator('value');
    expect(operator.query()).toEqual({ equals: 'value' });
  });

  it('should accept visitor', () => {
    const operator = new UnknownOperator('value');
    const visitor = {
      visitUnknown: vi.fn().mockReturnValue('visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'field');
    expect(visitor.visitUnknown).toHaveBeenCalledWith(operator, 'field');
    expect(result).toBe('visited');
  });
});
