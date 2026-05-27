import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { LessThanOrEqualOperator } from './less-than-or-equals-operator';

describe('LessThanOrEqualOperator', () => {
  it('deve parsear valor numerico corretamente', () => {
    const operator = new LessThanOrEqualOperator('lte=18');
    expect(operator.value()).toBe(18);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new LessThanOrEqualOperator('lte=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve retornar query object de lte', () => {
    const operator = new LessThanOrEqualOperator('lte=25');
    expect(operator.query()).toEqual({ lte: 25 });
  });

  it('deve aceitar o visitor correspondente ao lessThanOrEquals', () => {
    const operator = new LessThanOrEqualOperator('lte=10');
    const visitor = {
      visitLessThanOrEquals: vi.fn().mockReturnValue('lte-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'age');
    expect(visitor.visitLessThanOrEquals).toHaveBeenCalledWith(operator, 'age');
    expect(result).toBe('lte-visited');
  });
});
