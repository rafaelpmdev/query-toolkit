import { describe, expect, it } from 'vitest';
import { RsqlStringParser } from './rsql-string-parser';

describe('RsqlStringParser', () => {
  it('should parse simple equality', () => {
    const parser = new RsqlStringParser('name==John');
    expect(parser.parse()).toEqual({ name: '==John' });
  });

  it('should parse multiple filters with AND (;)', () => {
    const parser = new RsqlStringParser('name==John;age=gt=18');
    expect(parser.parse()).toEqual({
      name: '==John',
      age: 'gt=18',
    });
  });

  it('should handle repeated fields by converting to array', () => {
    const parser = new RsqlStringParser('tag==v1;tag==v2;tag==v3');
    const result: any = parser.parse();
    expect(result.tag).toEqual(['==v1', '==v2', '==v3']);
  });

  it('should skip parts without operators', () => {
    const parser = new RsqlStringParser('name==John;invalid_part');
    const result: any = parser.parse();
    expect(result.name).toBe('==John');
    expect(result.invalid_part).toBeUndefined();
  });

  it('should parse multiple filters with OR (,)', () => {
    const parser = new RsqlStringParser('status==ACTIVE,status==PENDING');
    expect(parser.parse()).toEqual({
      status: ['==ACTIVE', '==PENDING'],
    });
  });

  it('should parse complex operators', () => {
    const parser = new RsqlStringParser('tags=@>tag1,tag2;price=btw=10,100');
    expect(parser.parse()).toEqual({
      tags: '@>tag1,tag2',
      price: 'btw=10,100',
    });
  });

  it('should handle empty or undefined input', () => {
    expect(new RsqlStringParser('').parse()).toEqual({});
  });

  it('should handle spaces around operators and separators', () => {
    const parser = new RsqlStringParser(' name == John ; age =gt= 18 ');
    expect(parser.parse()).toEqual({
      name: '== John',
      age: 'gt= 18',
    });
  });

  it('should not confuse fields ending in "in" (like origin) with the "in=" operator', () => {
    const parser = new RsqlStringParser('origin==Brazil;roast==MEDIUM;price=btw=20,60');
    expect(parser.parse()).toEqual({
      origin: '==Brazil',
      roast: '==MEDIUM',
      price: 'btw=20,60',
    });
  });

  it('should parse correctly if field contains operator substring or if multiple operators are present', () => {
    const parser = new RsqlStringParser('age==gt=10;name==');
    expect(parser.parse()).toEqual({
      age: '==gt=10',
      name: '==',
    });
  });

  it('should parse complex query strings efficiently under high iteration load (stress test)', () => {
    const rawFilter = 'origin==Brazil;roast==MEDIUM;price=btw=20,60;tags=@>organic,premium';
    const start = performance.now();

    // Executa 15.000 iterações para simular altíssima carga sem causar falsos negativos por variação de CPU
    for (let i = 0; i < 15000; i++) {
      const parser = new RsqlStringParser(rawFilter);
      const result = parser.parse();
      expect(result).toBeDefined();
    }

    const end = performance.now();
    const duration = end - start;

    // eslint-disable-next-line no-console
    console.log(
      `[Performance] Tempo para processar 15k requisições RSQL: ${duration.toFixed(2)}ms`
    );

    // O parser otimizado é extremamente rápido (normalmente < 200ms em 15k, mas aceita até 5000ms para evitar flutuações em coverage ou CI lento)
    expect(duration).toBeLessThan(5000);
  });
});
