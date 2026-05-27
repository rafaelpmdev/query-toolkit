import { describe, expect, it, vi } from 'vitest';
import { OperatorVisitor } from '../../converters';
import { ContainsOperator } from './contains-operator';

describe('ContainsOperator', () => {
  it('deve extrair a string do parâmetro bruto e remover espacos extras', () => {
    const operator = new ContainsOperator('~=  search_term  ');
    expect(operator.value()).toBe('search_term');
  });

  it('deve retornar query object de contains', () => {
    const operator = new ContainsOperator('~=coffee');
    expect(operator.query()).toEqual({ contains: 'coffee' });
  });

  it('deve aceitar o visitor correspondente ao contains', () => {
    const operator = new ContainsOperator('~=coffee');
    const visitor = {
      visitContains: vi.fn().mockReturnValue('contains-visited'),
    } as unknown as OperatorVisitor<string>;

    const result = operator.accept(visitor, 'name');
    expect(visitor.visitContains).toHaveBeenCalledWith(operator, 'name');
    expect(result).toBe('contains-visited');
  });
});
