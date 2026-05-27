import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { NotContainsOperator } from './not-contains-operator';

describe('NotContainsOperator', () => {
  it('deve extrair a string do parâmetro bruto e remover espacos extras', () => {
    const operator = new NotContainsOperator('!~=  search_term  ');
    expect(operator.value()).toBe('search_term');
  });

  it('deve retornar query object de notContains', () => {
    const operator = new NotContainsOperator('!~=coffee');
    expect(operator.query()).toEqual({ notContains: 'coffee' });
  });

  it('deve aceitar o visitor correspondente ao notContains', () => {
    const operator = new NotContainsOperator('!~=coffee');
    const visitor = {
      visitNotContains: vi.fn().mockReturnValue('not-contains-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'name');
    expect(visitor.visitNotContains).toHaveBeenCalledWith(operator, 'name');
    expect(result).toBe('not-contains-visited');
  });
});
