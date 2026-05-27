import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { InOperator } from './in-operator';

describe('InOperator', () => {
  it('deve retornar a lista de valores fornecida no construtor', () => {
    const operator = new InOperator(['v1', 'v2', 3]);
    expect(operator.value()).toEqual(['v1', 'v2', 3]);
  });

  it('deve lancar um erro se values nao for uma lista/array', () => {
    expect(() => new InOperator('not-an-array' as any)).toThrowError('Values must be an array');
  });

  it('deve retornar query object de in', () => {
    const operator = new InOperator(['v1', 'v2']);
    expect(operator.query()).toEqual({ in: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao in', () => {
    const operator = new InOperator(['v1']);
    const visitor = {
      visitIn: vi.fn().mockReturnValue('in-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'status');
    expect(visitor.visitIn).toHaveBeenCalledWith(operator, 'status');
    expect(result).toBe('in-visited');
  });
});
