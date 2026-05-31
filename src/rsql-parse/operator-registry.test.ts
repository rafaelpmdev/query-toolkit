import { describe, expect, it, vi } from 'vitest';
import {
  ArrayContainsOperator,
  ArrayIsContainedByOperator,
  ArrayOverlapOperator,
  BetweenOperator,
  ContainsOperator,
  EqualsOperator,
  GreaterThanOperator,
  GreaterThanOrEqualsOperator,
  InOperator,
  LessThanOperator,
  LessThanOrEqualOperator,
  NotContainsOperator,
  NotEqualsOperator,
  NotInOperator,
  UnknownOperator,
} from '../query-operator';
import { QueryParamsOperator } from '../query-operator';
import { OperatorVisitor } from '../converters';
import { Nullable } from '@raicamposs/toolkit';
import { RsqlCondition } from '../types';
import { OperatorRegistry, parseRsqlListValue } from './operator-registry';

// Operador customizado fictício para simular o caso geográfico (PostGIS)
class GeoDistanceOperator extends QueryParamsOperator {
  constructor(public readonly rawParams: string) {
    super('<->=' as any, rawParams);
  }

  value() {
    return parseFloat(this.getRawValue());
  }

  query(): Nullable<RsqlCondition> {
    return { equals: this.value() } as unknown as RsqlCondition;
  }

  accept<T>(visitor: OperatorVisitor<T>, field: string): T {
    // Simula a visita delegando para o visitUnknown por simplicidade no mock
    return visitor.visitUnknown(this as any, field);
  }
}

describe('OperatorRegistry & Extensibilidade OCP', () => {
  it('deve resolver os operadores padrão nativos', () => {
    const op = OperatorRegistry.resolve('==Brazil');
    expect(op).toBeInstanceOf(EqualsOperator);
    expect(op.value()).toBe('Brazil');
  });

  it('deve suportar o registro de um operador customizado e resolvê-lo com sucesso', () => {
    // Registrar o novo operador geográfico
    OperatorRegistry.register('<->=' as any, (params) => new GeoDistanceOperator(params));

    const op = OperatorRegistry.resolve('<->=100.5');

    expect(op).toBeInstanceOf(GeoDistanceOperator);
    expect(op.symbol).toBe('<->=');
    expect(op.value()).toBe(100.5);
  });

  it('deve parsear strings de lista de valores de forma genérica', () => {
    const list = parseRsqlListValue('in=v1,v2,3.5', 'in=');
    expect(list).toEqual(['v1', 'v2', 3.5]);
  });

  it('deve extrair a lista corretamente mesmo se os valores contiverem o simbolo do operador', () => {
    const list = parseRsqlListValue('in=valor1,in=valor2', 'in=');
    expect(list).toEqual(['valor1', 'in=valor2']);
  });

  it('deve retornar array vazio se o símbolo não coincidir ao parsear a lista', () => {
    const list = parseRsqlListValue('in=v1,v2', 'out=');
    expect(list).toEqual([]);
  });
});
