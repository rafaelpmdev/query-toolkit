import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { ArrayIsContainedByOperator } from './array-is-contained-by-operator';

describe('ArrayIsContainedByOperator', () => {
  it('deve extrair valores de array do parâmetro bruto', () => {
    const operator = new ArrayIsContainedByOperator('<@v1,v2,v3');
    expect(operator.value()).toEqual(['v1', 'v2', 'v3']);
  });

  it('deve retornar query object de arrayIsContainedBy com os valores corretos', () => {
    const operator = new ArrayIsContainedByOperator('<@v1,v2');
    expect(operator.query()).toEqual({ arrayIsContainedBy: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao arrayIsContainedBy', () => {
    const operator = new ArrayIsContainedByOperator('<@v1');
    const visitor = {
      visitArrayIsContainedBy: vi.fn().mockReturnValue('array-is-contained-by-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'tags');
    expect(visitor.visitArrayIsContainedBy).toHaveBeenCalledWith(operator, 'tags');
    expect(result).toBe('array-is-contained-by-visited');
  });

  it('deve lidar com strings vazias e espacos extras ao redor dos valores', () => {
    const operator = new ArrayIsContainedByOperator('<@ v1 ,  , v2 ');
    expect(operator.value()).toEqual(['v1', 'v2']);
  });
});
