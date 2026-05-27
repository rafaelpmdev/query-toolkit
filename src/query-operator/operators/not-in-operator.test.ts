import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { NotInOperator } from './not-in-operator';

describe('NotInOperator', () => {
  it('deve retornar a lista de valores fornecida no construtor', () => {
    const operator = new NotInOperator(['v1', 'v2', 3]);
    expect(operator.value()).toEqual(['v1', 'v2', 3]);
  });

  it('deve lancar um erro se values nao for uma lista/array', () => {
    expect(() => new NotInOperator('not-an-array' as any)).toThrowError('Values must be an array');
  });

  it('deve retornar query object de notIn', () => {
    const operator = new NotInOperator(['v1', 'v2']);
    expect(operator.query()).toEqual({ notIn: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao notIn', () => {
    const operator = new NotInOperator(['v1']);
    const visitor = {
      visitNotIn: vi.fn().mockReturnValue('not-in-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'status');
    expect(visitor.visitNotIn).toHaveBeenCalledWith(operator, 'status');
    expect(result).toBe('not-in-visited');
  });
});
