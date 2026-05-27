import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { LessThanOperator } from './less-than-operator';

describe('LessThanOperator', () => {
  it('deve parsear valor numerico corretamente', () => {
    const operator = new LessThanOperator('lt=18');
    expect(operator.value()).toBe(18);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new LessThanOperator('lt=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve retornar query object de lt', () => {
    const operator = new LessThanOperator('lt=25');
    expect(operator.query()).toEqual({ lt: 25 });
  });

  it('deve aceitar o visitor correspondente ao lessThan', () => {
    const operator = new LessThanOperator('lt=10');
    const visitor = {
      visitLessThan: vi.fn().mockReturnValue('lt-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'age');
    expect(visitor.visitLessThan).toHaveBeenCalledWith(operator, 'age');
    expect(result).toBe('lt-visited');
  });
});
