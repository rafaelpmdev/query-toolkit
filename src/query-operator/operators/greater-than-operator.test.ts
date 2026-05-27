import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { GreaterThanOperator } from './greater-than-operator';

describe('GreaterThanOperator', () => {
  it('deve parsear valor numerico corretamente', () => {
    const operator = new GreaterThanOperator('gt=18');
    expect(operator.value()).toBe(18);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new GreaterThanOperator('gt=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve parsear valor string literal se nao for numero nem data', () => {
    const operator = new GreaterThanOperator('gt=abc');
    expect(operator.value()).toBe('abc');
  });

  it('deve retornar query object de gt', () => {
    const operator = new GreaterThanOperator('gt=25');
    expect(operator.query()).toEqual({ gt: 25 });
  });

  it('deve aceitar o visitor correspondente ao greaterThan', () => {
    const operator = new GreaterThanOperator('gt=10');
    const visitor = {
      visitGreaterThan: vi.fn().mockReturnValue('gt-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'age');
    expect(visitor.visitGreaterThan).toHaveBeenCalledWith(operator, 'age');
    expect(result).toBe('gt-visited');
  });
});
