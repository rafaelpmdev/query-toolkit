import { Nullable } from '@raicamposs/toolkit';
import { describe, expect, it } from 'vitest';
import { OperatorVisitor } from '../converters';
import { PrimitiveValueTypes } from '../sql-builder/core';
import { RsqlCondition } from '../types';
import { QueryParamsOperator } from './query-params-operator';

// Criamos uma classe de mock concreta que herda de QueryParamsOperator para testar a base abstrata
class MockOperator extends QueryParamsOperator {
  value(): PrimitiveValueTypes | PrimitiveValueTypes[] {
    return this.getRawValue();
  }

  query(): Nullable<RsqlCondition> {
    return null;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    return 'mock-visited' as unknown as T;
  }

  public testGetRawValue(): string {
    return this.getRawValue();
  }
}

describe('QueryParamsOperator Base Class', () => {
  it('deve armazenar symbol e params corretamente no construtor', () => {
    const operator = new MockOperator('==', '==my_value');
    expect(operator.symbol).toBe('==');
    expect(operator.params).toBe('==my_value');
  });

  it('deve extrair o valor bruto utilizando getRawValue removendo o symbol correspondente', () => {
    const operator = new MockOperator('==', '==my_value');
    expect(operator.testGetRawValue()).toBe('my_value');
  });

  it('deve retornar os params inteiros em getRawValue se o symbol nao estiver presente nos params', () => {
    const operator = new MockOperator('==', 'only_value');
    expect(operator.testGetRawValue()).toBe('only_value');
  });
});
