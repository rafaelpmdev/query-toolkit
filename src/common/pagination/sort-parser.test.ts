import { describe, it, expect } from 'vitest';
import { SortParser } from './sort-parser';

describe('SortParser', () => {
  it('deve retornar um objeto vazio quando sort for indefinido, nulo ou vazio', () => {
    expect(SortParser.parse(undefined)).toEqual({});
    expect(SortParser.parse(null)).toEqual({});
    expect(SortParser.parse('')).toEqual({});
    expect(SortParser.parse('   ')).toEqual({});
  });

  it('deve parsear o formato clássico com dois pontos (campo:direção)', () => {
    expect(SortParser.parse('name:asc')).toEqual({ name: 'asc' });
    expect(SortParser.parse('price:desc')).toEqual({ price: 'desc' });
    expect(SortParser.parse('name:ASC,price:DESC')).toEqual({ name: 'asc', price: 'desc' });
  });

  it('deve parsear o formato com prefixo de sinal (+ e -)', () => {
    expect(SortParser.parse('-price')).toEqual({ price: 'desc' });
    expect(SortParser.parse('+name')).toEqual({ name: 'asc' });
    expect(SortParser.parse('+name,-price')).toEqual({ name: 'asc', price: 'desc' });
  });

  it('deve adotar asc por padrão quando nenhum prefixo ou direção for fornecido', () => {
    expect(SortParser.parse('name')).toEqual({ name: 'asc' });
    expect(SortParser.parse('name,price')).toEqual({ name: 'asc', price: 'asc' });
  });

  it('deve lidar com uma mistura de diferentes formatos na mesma string', () => {
    const rawSort = 'name:desc,-price,available,+roast:desc';
    expect(SortParser.parse(rawSort)).toEqual({
      name: 'desc',
      price: 'desc',
      available: 'asc',
      roast: 'desc',
    });
  });

  it('deve lidar com espaços extras entre os campos de forma robusta', () => {
    expect(SortParser.parse('  name : asc  ,   -price  ')).toEqual({
      name: 'asc',
      price: 'desc',
    });
  });

  it('deve ignorar entradas que resultam em campo vazio após remover o prefixo de sinal', () => {
    expect(SortParser.parse('-')).toEqual({});
    expect(SortParser.parse('+')).toEqual({});
    expect(SortParser.parse('-  ')).toEqual({});
    expect(SortParser.parse('+  ')).toEqual({});
  });

  it('deve ignorar entradas no formato colon com campo vazio (:asc)', () => {
    expect(SortParser.parse(':asc')).toEqual({});
    expect(SortParser.parse(':desc')).toEqual({});
  });

  it('deve filtrar entradas inválidas mas manter as válidas na mesma string', () => {
    expect(SortParser.parse('name:asc,-,price:desc')).toEqual({
      name: 'asc',
      price: 'desc',
    });
  });
});
