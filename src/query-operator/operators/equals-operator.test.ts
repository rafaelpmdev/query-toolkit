import { describe, expect, it } from 'vitest';
import { EqualsOperator } from './equals-operator';

describe('EqualsOperator', () => {
  it('should parse string value', () => {
    const operator = new EqualsOperator('==value');
    expect(operator.value()).toBe('value');
  });

  it('should parse number value', () => {
    const operator = new EqualsOperator('==123');
    expect(operator.value()).toBe(123);
  });

  it('should parse boolean value', () => {
    const operator = new EqualsOperator('==true');
    expect(operator.value()).toBe(true);
  });

  it('should return query object', () => {
    const operator = new EqualsOperator('==value');
    expect(operator.query()).toEqual({ equals: 'value' });
  });

  it('should get raw value without symbol', () => {
    const operator = new EqualsOperator('==test');
    // @ts-ignore - accessing protected method for testing
    expect(operator.getRawValue()).toBe('test');
  });
});
