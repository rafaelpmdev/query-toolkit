import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { ArrayOverlapOperator } from './array-overlap-operator';

describe('ArrayOverlapOperator', () => {
  it('deve extrair valores de array do parâmetro bruto', () => {
    const operator = new ArrayOverlapOperator('&&v1,v2,v3');
    expect(operator.value()).toEqual(['v1', 'v2', 'v3']);
  });

  it('deve retornar query object de arrayOverlap com os valores corretos', () => {
    const operator = new ArrayOverlapOperator('&&v1,v2');
    expect(operator.query()).toEqual({ arrayOverlap: ['v1', 'v2'] });
  });

  it('deve aceitar o visitor correspondente ao arrayOverlap', () => {
    const operator = new ArrayOverlapOperator('&&v1');
    const visitor = {
      visitArrayOverlap: vi.fn().mockReturnValue('array-overlap-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'tags');
    expect(visitor.visitArrayOverlap).toHaveBeenCalledWith(operator, 'tags');
    expect(result).toBe('array-overlap-visited');
  });

  it('deve lidar com strings vazias e espacos extras ao redor dos valores', () => {
    const operator = new ArrayOverlapOperator('&& v1 ,  , v2 ');
    expect(operator.value()).toEqual(['v1', 'v2']);
  });
});
