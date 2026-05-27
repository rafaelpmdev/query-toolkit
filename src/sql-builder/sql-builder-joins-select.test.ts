import { describe, expect, it } from 'vitest';
import { SqlBuilder } from './sql-builder';

// ─── Domain fixture ─────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  active: boolean;
}

const columnMapper: Partial<Record<keyof User & string, string>> = {
  createdAt: 'created_at',
};

// ─── SELECT ──────────────────────────────────────────────────────────────────

describe('SqlBuilder — select()', () => {
  it('should default to SELECT * when no select() is called', () => {
    const { sql } = SqlBuilder.from<User>('users').build();
    expect(sql).toBe('SELECT * FROM users');
  });

  it('should replace SELECT * with specified columns', () => {
    const { sql } = SqlBuilder.from<User>('users').select('id', 'name').build();
    expect(sql).toBe('SELECT id, name FROM users');
  });

  it('should apply columnMapper when selecting mapped fields', () => {
    const { sql } = SqlBuilder.from<User>('users', columnMapper).select('id', 'createdAt').build();
    expect(sql).toBe('SELECT id, created_at FROM users');
  });

  it('should support incremental select() calls (chaining)', () => {
    const { sql } = SqlBuilder.from<User>('users').select('id').select('name', 'email').build();
    expect(sql).toBe('SELECT id, name, email FROM users');
  });
});

describe('SqlBuilder — selectRaw()', () => {
  it('should add a raw expression to the SELECT clause', () => {
    const { sql } = SqlBuilder.from<User>('users').selectRaw('COUNT(*) as total').build();
    expect(sql).toBe('SELECT COUNT(*) as total FROM users');
  });

  it('should add an aliased raw expression', () => {
    const { sql } = SqlBuilder.from<User>('users').selectRaw('LOWER(email)', 'email_lower').build();
    expect(sql).toBe('SELECT LOWER(email) AS email_lower FROM users');
  });

  it('should NOT apply columnMapper to selectRaw expressions', () => {
    // "createdAt" should remain as-is — caller is responsible
    const { sql } = SqlBuilder.from<User>('users', columnMapper).selectRaw('createdAt').build();
    expect(sql).toBe('SELECT createdAt FROM users');
  });

  it('should mix select() and selectRaw() in the same query', () => {
    const { sql } = SqlBuilder.from<User>('users', columnMapper)
      .select('id', 'name')
      .selectRaw('COUNT(*) as total')
      .build();
    expect(sql).toBe('SELECT id, name, COUNT(*) as total FROM users');
  });
});

describe('SqlBuilder — selectAs()', () => {
  it('should add a column with an explicit alias', () => {
    const { sql } = SqlBuilder.from<User>('users').selectAs('name', 'userName').build();
    expect(sql).toBe('SELECT name AS userName FROM users');
  });

  it('should apply columnMapper to the field before aliasing', () => {
    const { sql } = SqlBuilder.from<User>('users', columnMapper)
      .selectAs('createdAt', 'createdAtAlias')
      .build();
    expect(sql).toBe('SELECT created_at AS createdAtAlias FROM users');
  });

  it('should combine select(), selectAs() and selectRaw()', () => {
    const { sql } = SqlBuilder.from<User>('users', columnMapper)
      .select('id')
      .selectAs('name', 'fullName')
      .selectRaw('NOW()', 'serverTime')
      .build();
    expect(sql).toBe('SELECT id, name AS fullName, NOW() AS serverTime FROM users');
  });
});

describe('SqlBuilder — count() ignores select()', () => {
  it('should preserve COUNT(*) even when select() is called', () => {
    const { sql } = SqlBuilder.count<User>('users').select('id', 'name').build();
    expect(sql).toBe('SELECT COUNT(*) as count FROM users');
  });

  it('should preserve COUNT(*) even when selectRaw() is called', () => {
    const { sql } = SqlBuilder.count<User>('users').selectRaw('id').build();
    expect(sql).toBe('SELECT COUNT(*) as count FROM users');
  });
});

// ─── JOIN ─────────────────────────────────────────────────────────────────────

describe('SqlBuilder — join()', () => {
  it('should produce an INNER JOIN in the correct SQL position', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .join('orders', 'users.id', 'orders.user_id')
      .build();
    expect(sql).toBe('SELECT * FROM users JOIN orders ON users.id = orders.user_id');
  });

  it('should place JOIN after FROM and before WHERE', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .join('orders', 'users.id', 'orders.user_id')
      .whereEquals('id', 1)
      .build();
    expect(sql).toMatch(/FROM users JOIN orders ON .+ WHERE/);
    expect(sql).not.toMatch(/WHERE.+JOIN/);
  });
});

describe('SqlBuilder — leftJoin()', () => {
  it('should produce a LEFT JOIN clause', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .leftJoin('addresses', 'users.id', 'addresses.user_id')
      .build();
    expect(sql).toBe('SELECT * FROM users LEFT JOIN addresses ON users.id = addresses.user_id');
  });
});

describe('SqlBuilder — rightJoin()', () => {
  it('should produce a RIGHT JOIN clause', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .rightJoin('profiles', 'users.id', 'profiles.user_id')
      .build();
    expect(sql).toBe('SELECT * FROM users RIGHT JOIN profiles ON users.id = profiles.user_id');
  });
});

describe('SqlBuilder — fullJoin()', () => {
  it('should produce a FULL OUTER JOIN clause', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .fullJoin('audit_log', 'users.id', 'audit_log.entity_id')
      .build();
    expect(sql).toBe(
      'SELECT * FROM users FULL OUTER JOIN audit_log ON users.id = audit_log.entity_id'
    );
  });
});

describe('SqlBuilder — joinRaw()', () => {
  it('should append a raw JOIN expression without transformation', () => {
    const { sql } = SqlBuilder.from<User>('users')
      .joinRaw('INNER JOIN tags t ON t.id = ANY(users.tag_ids)')
      .build();
    expect(sql).toBe('SELECT * FROM users INNER JOIN tags t ON t.id = ANY(users.tag_ids)');
  });

  it('should allow joinRaw() for the same table multiple times (no duplicate check)', () => {
    // joinRaw bypasses the duplicate table guard by design
    const builder = SqlBuilder.from<User>('users')
      .joinRaw('LEFT JOIN orders o1 ON o1.user_id = users.id')
      .joinRaw('LEFT JOIN orders o2 ON o2.user_id = users.id');
    expect(() => builder.build()).not.toThrow();
  });
});

describe('SqlBuilder — duplicate JOIN detection', () => {
  it('should throw RangeError when the same table is joined twice via join()', () => {
    const builder = SqlBuilder.from<User>('users').join('orders', 'users.id', 'orders.user_id');
    expect(() => builder.join('orders', 'users.id', 'orders.user_id')).toThrowError(
      /Duplicate JOIN detected/
    );
  });

  it('should throw RangeError for duplicate table even with different JOIN types', () => {
    const builder = SqlBuilder.from<User>('users').join('orders', 'users.id', 'orders.user_id');
    expect(() => builder.leftJoin('orders', 'users.id', 'orders.user_id')).toThrowError(
      /Duplicate JOIN detected/
    );
  });

  it('should be case-insensitive when checking for duplicate tables', () => {
    const builder = SqlBuilder.from<User>('users').join('Orders', 'users.id', 'Orders.user_id');
    expect(() => builder.join('orders', 'users.id', 'orders.user_id')).toThrowError(
      /Duplicate JOIN detected/
    );
  });
});

describe('SqlBuilder — maxJoins config', () => {
  it('should throw RangeError when maxJoins is exceeded via join()', () => {
    const builder = SqlBuilder.from<User>('users', undefined, { maxJoins: 1 }).join(
      'orders',
      'users.id',
      'orders.user_id'
    );
    expect(() => builder.leftJoin('profiles', 'users.id', 'profiles.user_id')).toThrowError(
      /Maximum JOIN clauses exceeded: 1/
    );
  });

  it('should throw RangeError when maxJoins is exceeded via joinRaw()', () => {
    const builder = SqlBuilder.from<User>('users', undefined, { maxJoins: 1 }).joinRaw(
      'LEFT JOIN orders o ON o.user_id = users.id'
    );
    expect(() => builder.joinRaw('LEFT JOIN profiles p ON p.user_id = users.id')).toThrowError(
      /Maximum JOIN clauses exceeded: 1/
    );
  });
});

// ─── Integração completa ──────────────────────────────────────────────────────

describe('SqlBuilder — build() com JOIN + WHERE + ORDER + LIMIT (ordem correta)', () => {
  it('should produce SQL with all clauses in the correct order', () => {
    const { sql, params } = SqlBuilder.from<User>('users', columnMapper)
      .select('id', 'name', 'createdAt')
      .join('orders', 'users.id', 'orders.user_id')
      .leftJoin('profiles', 'users.id', 'profiles.user_id')
      .whereEquals('active', true)
      .addOrder('desc', 'createdAt')
      .addLimit(10)
      .addOffset(20)
      .build();

    expect(sql).toBe(
      'SELECT id, name, created_at FROM users' +
        ' JOIN orders ON users.id = orders.user_id' +
        ' LEFT JOIN profiles ON users.id = profiles.user_id' +
        ' WHERE (active = $1)' +
        ' ORDER BY created_at desc' +
        ' LIMIT 10' +
        ' OFFSET 20'
    );
    expect(params).toEqual([true]);
  });
});

// ─── clone() ─────────────────────────────────────────────────────────────────

describe('SqlBuilder — clone() copia joins e select corretamente', () => {
  it('should copy joins to the cloned instance', () => {
    const original = SqlBuilder.from<User>('users').join('orders', 'users.id', 'orders.user_id');
    const cloned = original.clone();
    expect(cloned.build().sql).toContain('JOIN orders');
  });

  it('should copy selects to the cloned instance', () => {
    const original = SqlBuilder.from<User>('users').select('id', 'name');
    const cloned = original.clone();
    expect(cloned.build().sql).toBe('SELECT id, name FROM users');
  });

  it('should produce independent state after clone — mutating original does not affect clone', () => {
    const original = SqlBuilder.from<User>('users').select('id');
    const cloned = original.clone();

    // Add a new join to the original after cloning
    original.leftJoin('orders', 'users.id', 'orders.user_id');

    expect(original.build().sql).toContain('JOIN orders');
    expect(cloned.build().sql).not.toContain('JOIN orders');
  });

  it('should preserve isCountQuery flag in the clone', () => {
    const countBuilder = SqlBuilder.count<User>('users');
    const cloned = countBuilder.clone().select('id', 'name');
    // SELECT should still be COUNT(*), not "id, name"
    expect(cloned.build().sql).toBe('SELECT COUNT(*) as count FROM users');
  });
});

// ─── reset() ─────────────────────────────────────────────────────────────────

describe('SqlBuilder — reset() limpa joins e selects', () => {
  it('should clear selects after reset()', () => {
    const builder = SqlBuilder.from<User>('users').select('id', 'name');
    builder.reset();
    expect(builder.build().sql).toBe('SELECT * FROM users');
  });

  it('should clear joins after reset()', () => {
    const builder = SqlBuilder.from<User>('users').join('orders', 'users.id', 'orders.user_id');
    builder.reset();
    expect(builder.build().sql).toBe('SELECT * FROM users');
  });
});
