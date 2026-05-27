/**
 * Testes de regressão para os bugs críticos corrigidos no SqlBuilder.
 * Cada describe documenta o comportamento esperado após a correção.
 */
import { describe, expect, it } from 'vitest';
import { SqlBuilder } from './sql-builder';

interface User {
  id: number;
  name: string;
  active: boolean;
  age: number;
}

// ─── Bug 1.1: toJSON() chamava build() como expressão inline ─────────────────

describe('SqlBuilder — toJSON() consistência com build()', () => {
  it('should return the same sql in toJSON() and build()', () => {
    const builder = SqlBuilder.from<User>('users').whereEquals('active', true).addLimit(10);
    const built = builder.build();
    const json = builder.toJSON();
    expect(json.sql).toBe(built.sql);
  });

  it('should include joins, selects and where in the JSON snapshot', () => {
    const builder = SqlBuilder.from<User>('users')
      .select('id', 'name')
      .join('orders', 'users.id', 'orders.user_id')
      .whereEquals('active', true);

    const json = builder.toJSON();

    expect(json.selects).toEqual(['id', 'name']);
    expect(json.joins).toEqual(['JOIN orders ON users.id = orders.user_id']);
    expect(json.sql).toContain('JOIN orders');
    expect(json.sql).toContain('WHERE');
  });
});

// ─── Bug 1.2: resolveSelectClause() recriava string toUpperCase() a cada build() ─

describe('SqlBuilder — resolveSelectClause() usa sqlFromIndex cacheado', () => {
  it('should apply select columns correctly without re-computing fromIndex', () => {
    const builder = SqlBuilder.from<User>('users').select('id', 'name');

    // Chama build() múltiplas vezes — o fromIndex deve ser reutilizado
    const first = builder.build().sql;
    const second = builder.build().sql;
    const third = builder.build().sql;

    expect(first).toBe('SELECT id, name FROM users');
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('should handle base sql with no FROM clause gracefully (fallback path)', () => {
    // Instância criada com SQL sem FROM para exercitar o branch fromIndex === -1
    const builder = new SqlBuilder<User>('users_raw_table').select('id');
    const { sql } = builder.build();
    expect(sql).toBe('SELECT id users_raw_table');
  });
});

// ─── Bug 1.3: whereRaw() ignorava maxWhereClauses ────────────────────────────

describe('SqlBuilder — whereRaw() respeita maxWhereClauses', () => {
  it('should add a raw where clause to the query correctly', () => {
    const { sql, params } = SqlBuilder.from<User>('users').whereRaw('age > $1', [18]).build();

    expect(sql).toBe('SELECT * FROM users WHERE (age > $1)');
    expect(params).toEqual([18]);
  });

  it('should throw RangeError when whereRaw exceeds maxWhereClauses', () => {
    const builder = SqlBuilder.from<User>('users', undefined, { maxWhereClauses: 1 });
    builder.whereRaw('age > $1', [18]); // atinge o limite

    expect(() => builder.whereRaw('age < $1', [65])).toThrowError(
      /Maximum WHERE clauses exceeded: 1/
    );
  });

  it('should count whereRaw together with other where methods for the limit', () => {
    const builder = SqlBuilder.from<User>('users', undefined, { maxWhereClauses: 2 });
    builder.whereEquals('active', true); // 1
    builder.whereRaw('age > $1', [18]); // 2 — atinge o limite

    expect(() => builder.whereEquals('id', 1)).toThrowError(/Maximum WHERE clauses exceeded: 2/);
  });

  it('should ignore empty string in whereRaw', () => {
    const { sql } = SqlBuilder.from<User>('users').whereRaw('').build();
    expect(sql).toBe('SELECT * FROM users');
  });

  it('should work with whereRaw and no params', () => {
    const { sql, params } = SqlBuilder.from<User>('users').whereRaw('active = true').build();
    expect(sql).toBe('SELECT * FROM users WHERE (active = true)');
    expect(params).toEqual([]);
  });
});

// ─── Bug 1.4: ClauseExistsBase usava '...' literal incondicional ─────────────

describe('SqlBuilder — whereExists() mensagem de erro sem ellipsis espúrio', () => {
  it('should not add "..." to short invalid subqueries in the error message', () => {
    const builder = SqlBuilder.from<User>('users');
    // O erro é lançado em build(), não em whereExists()
    builder.whereExists('DELETE FROM orders');
    // SQL curto (< 50 chars) — NÃO deve ter "..." ao final
    expect(() => builder.build()).toThrowError(
      /EXISTS clause requires a SELECT subquery\. Received: DELETE FROM orders$/
    );
  });

  it('should add "..." only when the invalid subquery exceeds 50 characters', () => {
    const longInvalidSql = 'DELETE FROM very_long_table_name WHERE some_column = some_value_here';
    const builder = SqlBuilder.from<User>('users');
    builder.whereExists(longInvalidSql);
    expect(() => builder.build()).toThrowError(/\.\.\.$/);
  });

  it('should work correctly with a valid short SELECT subquery (no ellipsis scenario)', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .whereExists('SELECT 1 FROM orders WHERE orders.user_id = users.id')
      .build();
    expect(sql).toContain('EXISTS');
    expect(sql).not.toContain('...');
  });

  it('whereNotExists should also use conditional preview (short SQL)', () => {
    const builder = SqlBuilder.from<User>('users');
    builder.whereNotExists('UPDATE orders SET x = 1');
    // SQL curto — sem "..." no final
    expect(() => builder.build()).toThrowError(
      /EXISTS clause requires a SELECT subquery\. Received: UPDATE orders SET x = 1$/
    );
  });
});
