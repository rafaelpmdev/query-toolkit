import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { ArrayContainsOperator } from './array-contains-operator';

describe('ArrayContainsOperator', () => {
  it('deve extrair valores de array do parâmetro bruto', () => {
    const operator = new ArrayContainsOperator('@>v1,v2,v3');
    expect(operator.value()).toEqual(['v1', 'v2', 'v3']);
  });

  it('deve retornar query object de arrayContains com os valores corretos', () => {
    const operator = new ArrayContainsOperator('@>v1,v2');
    expect(operator.query()).toEqual({ arrayContains: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao arrayContains', () => {
    const operator = new ArrayContainsOperator('@>v1');
    const visitor = {
      visitArrayContains: vi.fn().mockReturnValue('array-contains-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'tags');
    expect(visitor.visitArrayContains).toHaveBeenCalledWith(operator, 'tags');
    expect(result).toBe('array-contains-visited');
  });

  it('deve lidar com strings vazias e espacos extras ao redor dos valores', () => {
    const operator = new ArrayContainsOperator('@> v1 ,  , v2 ');
    expect(operator.value()).toEqual(['v1', 'v2']);
  });
});
