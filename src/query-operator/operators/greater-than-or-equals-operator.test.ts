import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { GreaterThanOrEqualsOperator } from './greater-than-or-equals-operator';

describe('GreaterThanOrEqualsOperator', () => {
  it('deve parsear valor numerico corretamente', () => {
    const operator = new GreaterThanOrEqualsOperator('gte=18');
    expect(operator.value()).toBe(18);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new GreaterThanOrEqualsOperator('gte=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve retornar query object de gte', () => {
    const operator = new GreaterThanOrEqualsOperator('gte=25');
    expect(operator.query()).toEqual({ gte: 25 });
  });

  it('deve aceitar o visitor correspondente ao greaterThanOrEquals', () => {
    const operator = new GreaterThanOrEqualsOperator('gte=10');
    const visitor = {
      visitGreaterThanOrEquals: vi.fn().mockReturnValue('gte-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'age');
    expect(visitor.visitGreaterThanOrEquals).toHaveBeenCalledWith(operator, 'age');
    expect(result).toBe('gte-visited');
  });
});
