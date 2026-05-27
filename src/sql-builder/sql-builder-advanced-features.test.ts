import { describe, expect, it, vi } from 'vitest';
import { SqlBuilder } from './sql-builder';

interface User {
  id: number;
  name: string;
  metadata: string;
}

describe('SqlBuilder — Recursos Avançados PostgreSQL JSONB', () => {
  it('should compile whereJsonbContains with correct object content', () => {
    const { sql, params } = SqlBuilder.from<User>('users')
      .whereJsonbContains('metadata', { role: 'admin' })
      .build();

    expect(sql).toBe('SELECT * FROM users WHERE (metadata @> $1)');
    expect(params).toEqual(['{"role":"admin"}']);
  });

  it('should compile whereJsonbContains with array content', () => {
    const { sql, params } = SqlBuilder.from<User>('users')
      .whereJsonbContains('metadata', ['tag1', 'tag2'])
      .build();

    expect(sql).toBe('SELECT * FROM users WHERE (metadata @> $1)');
    expect(params).toEqual(['["tag1","tag2"]']);
  });

  it('should compile whereJsonbExists using safe PostgreSQL jsonb_exists function', () => {
    const { sql, params } = SqlBuilder.from<User>('users')
      .whereJsonbExists('metadata', 'role')
      .build();

    expect(sql).toBe('SELECT * FROM users WHERE (jsonb_exists(metadata, $1))');
    expect(params).toEqual(['role']);
  });

  it('should compile whereJsonbPath with nested path and comparison operator', () => {
    const { sql, params } = SqlBuilder.from<User>('users')
      .whereJsonbPath('metadata', 'preferences.theme', '=', 'dark')
      .build();

    expect(sql).toBe("SELECT * FROM users WHERE (metadata -> 'preferences' ->> 'theme' = $1)");
    expect(params).toEqual(['dark']);
  });

  it('should compile whereJsonbPath with different operators', () => {
    const { sql, params } = SqlBuilder.from<User>('users')
      .whereJsonbPath('metadata', 'age', '>=', 18)
      .build();

    expect(sql).toBe("SELECT * FROM users WHERE (metadata ->> 'age' >= $1)");
    expect(params).toEqual([18]);
  });
});

describe('SqlBuilder — Observabilidade e Telemetria (onBuild)', () => {
  it('should trigger onBuild listener when query is successfully compiled', () => {
    const builder = SqlBuilder.from<User>('users').whereEquals('name', 'John');
    const spy = vi.fn();

    builder.onBuild(spy);
    const { sql, params } = builder.build();

    expect(spy).toHaveBeenCalledOnce();
    const event = spy.mock.calls[0][0];
    expect(event.sql).toBe(sql);
    expect(event.params).toEqual(params);
    expect(typeof event.durationMs).toBe('number');
    expect(event.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should not throw if the listener fails (resilience)', () => {
    const builder = SqlBuilder.from<User>('users');
    builder.onBuild(() => {
      throw new Error('APM tracking failed');
    });

    // should succeed despite the listener failure
    expect(() => builder.build()).not.toThrow();
  });
});

describe('SqlBuilder — Opção de Configuração prettyPrint', () => {
  it('should keep multi-space characters when prettyPrint is false', () => {
    const { sql } = new SqlBuilder<User>('SELECT   *   FROM   users', undefined, {
      prettyPrint: false,
    })
      .whereEquals('name', 'John')
      .build();

    expect(sql).toContain('SELECT   *   FROM   users WHERE');
  });

  it('should compact multi-spaces when prettyPrint is true (default)', () => {
    const { sql } = new SqlBuilder<User>('SELECT   *   FROM   users', undefined, {
      prettyPrint: true,
    })
      .whereEquals('name', 'John')
      .build();

    expect(sql).toBe('SELECT * FROM users WHERE (name = $1)');
  });
});

describe('SqlBuilder — Segurança Preventiva contra SQL Injection', () => {
  it('should emit a console.warn in development mode when suspicious raw string concat is detected', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Config explicitly enabling security warnings
    const builder = SqlBuilder.from<User>('users', undefined, { enableSecurityWarnings: true });

    // Suspicious: uses inline single quotes, no parameters
    builder.whereRaw("name = 'John'");

    expect(consoleWarnSpy).toHaveBeenCalled();
    const warnMsg = consoleWarnSpy.mock.calls[0][0];
    expect(warnMsg).toContain('[SqlBuilder Security Warning]');
    expect(warnMsg).toContain("name = 'John'");

    consoleWarnSpy.mockRestore();
  });

  it('should not emit a warning if parameters are used', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const builder = SqlBuilder.from<User>('users', undefined, { enableSecurityWarnings: true });
    builder.whereRaw('name = $1', ['John']);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should not emit a warning if enableSecurityWarnings is explicitly disabled', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const builder = SqlBuilder.from<User>('users', undefined, { enableSecurityWarnings: false });
    builder.whereRaw("name = 'John'");

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});

describe('SqlBuilder — Otimização Regex Cache', () => {
  it('should successfully compile buildRaw multiple times using static regex cache', () => {
    const builder = SqlBuilder.from<User>('users').whereEquals('name', 'John');

    const raw1 = builder.buildRaw();
    const raw2 = builder.buildRaw();

    expect(raw1).toBe("SELECT * FROM users WHERE (name = 'John')");
    expect(raw2).toBe(raw1);
  });
});
