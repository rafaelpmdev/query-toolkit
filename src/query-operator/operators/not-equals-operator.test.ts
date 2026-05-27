import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { NotEqualsOperator } from './not-equals-operator';

describe('NotEqualsOperator', () => {
  it('deve parsear valor string literal corretamente', () => {
    const operator = new NotEqualsOperator('!=value');
    expect(operator.value()).toBe('value');
  });

  it('deve parsear valor numerico corretamente', () => {
    const operator = new NotEqualsOperator('!=123');
    expect(operator.value()).toBe(123);
  });

  it('deve parsear string de data corretamente', () => {
    const operator = new NotEqualsOperator('!=2024-01-01');
    const value = operator.value() as Date;
    expect(value).toBeInstanceOf(Date);
    expect(value.toISOString()).toContain('2024-01-01');
  });

  it('deve retornar query object de notEquals', () => {
    const operator = new NotEqualsOperator('!=value');
    expect(operator.query()).toEqual({ notEquals: 'value' });
  });

  it('deve aceitar o visitor correspondente ao notEquals', () => {
    const operator = new NotEqualsOperator('!=value');
    const visitor = {
      visitNotEquals: vi.fn().mockReturnValue('not-equals-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'name');
    expect(visitor.visitNotEquals).toHaveBeenCalledWith(operator, 'name');
    expect(result).toBe('not-equals-visited');
  });
});
