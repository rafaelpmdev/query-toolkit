import { describe, expect, it } from 'vitest';
import { ClauseEquals } from './implementations/clause-equals';
import { SqlBuilder } from './sql-builder';

interface TestTable {
  id: number;
  name: string;
  email: string;
  age: number;
  status: string;
  created_at: Date;
  tags: string[];
  active: boolean;
}

describe('SqlBuilder', () => {
  describe('where clauses', () => {
    describe('whereEquals', () => {
      it('should add equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('status', 'active');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (status = $1)',
          params: ['active'],
        });
      });

      it('should handle number equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereEquals('age', 25);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age = $1)',
          params: [25],
        });
      });
    });

    describe('whereNotEquals', () => {
      it('should add not equals filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotEquals('status', 'deleted');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (status <> $1)',
          params: ['deleted'],
        });
      });
    });

    describe('whereLike', () => {
      it('should add like filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLike('name', 'John%');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (name LIKE $1)',
          params: ['John%'],
        });
      });
    });

    describe('whereILike', () => {
      it('should add ilike filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereILike('name', 'john%');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (name ILIKE $1)',
          params: ['john%'],
        });
      });
    });

    describe('whereIn', () => {
      it('should add in filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereIn('status', ['active', 'pending']);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (status IN ($1, $2))',
          params: ['active', 'pending'],
        });
      });
    });

    describe('whereBetween', () => {
      it('should add between filter', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereBetween('age', 18, 30);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age BETWEEN $1 AND $2)',
          params: [18, 30],
        });
      });
    });

    describe('operators', () => {
      it('should handle greater than', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThan('age', 18);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age > $1)',
          params: [18],
        });
      });

      it('should handle greater than or equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereGreaterThanOrEquals('age', 18);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age >= $1)',
          params: [18],
        });
      });

      it('should handle less than', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThan('age', 30);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age < $1)',
          params: [30],
        });
      });

      it('should handle less than or equals', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereLessThanOrEquals('age', 30);
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (age <= $1)',
          params: [30],
        });
      });

      it('should handle array contains', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereArrayContains('tags', ['javascript']);
        const result = builder.build();
        expect(result.sql).toContain('tags');
        expect(result.sql).toContain('<@');
        expect(result.params).toEqual(['javascript']);
      });
    });

    describe('exists', () => {
      it('should handle whereExists', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereExists('SELECT 1 FROM profiles WHERE profiles.id = users.id');
        const result = builder.build();
        expect(result.sql).toContain('EXISTS (SELECT 1 FROM profiles');
        expect(result.params).toEqual([]);
      });

      it('should handle whereNotExists', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereNotExists('SELECT 1 FROM profiles WHERE profiles.id = users.id');
        const result = builder.build();
        expect(result.sql).toContain('NOT EXISTS (SELECT 1 FROM profiles');
        expect(result.params).toEqual([]);
      });
    });

    describe('whereRaw', () => {
      it('should add raw where clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('active = true');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (active = true)',
          params: [],
        });
      });

      it('should ignore empty raw clause', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereRaw('');
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users',
          params: [],
        });
      });
    });

    describe('whereClause and andFilter', () => {
      it('should add clause instance', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.whereClause(new ClauseEquals('status', 'active'));
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (status = $1)',
          params: ['active'],
        });
      });
    });

    describe('orFilter', () => {
      it('should combine clauses with OR', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        builder.orFilter(
          new ClauseEquals('status', 'active'),
          new ClauseEquals('status', 'pending')
        );
        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE ((status = $1 OR status = $2))',
          params: ['active', 'pending'],
        });
      });
    });
  });

  describe('order by', () => {
    it('should add order by field', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('asc', 'name');
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users ORDER BY name asc',
        params: [],
      });
    });

    it('should allow chaining different orders', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOrder('desc', 'created_at').addOrder('asc', 'name');
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users ORDER BY created_at desc, name asc',
        params: [],
      });
    });

    it('should throw RangeError when exceeding MAX_ORDER_BY_CLAUSES', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      // Limit is 10. Let's add 11 fields.
      expect(() => {
        builder.addOrder(
          'asc',
          'name',
          'age',
          'id',
          'status',
          'created_at',
          'email',
          'active',
          'tags',
          'id',
          'name',
          'age'
        );
      }).toThrow(RangeError);
    });
  });

  describe('group by', () => {
    it('should add single group by field', () => {
      const builder = new SqlBuilder<TestTable>('SELECT id, COUNT(*) FROM users');
      builder.addGroup('id');
      expect(builder.build()).toEqual({
        sql: 'SELECT id, COUNT(*) FROM users GROUP BY id',
        params: [],
      });
    });

    it('should add multiple group by fields', () => {
      const builder = new SqlBuilder<TestTable>('SELECT status, age, COUNT(*) FROM users');
      builder.addGroup('status', 'age');
      expect(builder.build()).toEqual({
        sql: 'SELECT status, age, COUNT(*) FROM users GROUP BY status, age',
        params: [],
      });
    });

    it('should throw RangeError when exceeding MAX_GROUP_BY_CLAUSES', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      // Limit is 10.
      expect(() => {
        builder.addGroup(
          'name',
          'age',
          'id',
          'status',
          'created_at',
          'active',
          'email',
          'tags',
          'id',
          'name',
          'age'
        );
      }).toThrow(RangeError);
    });
  });

  describe('limit and offset', () => {
    it('should add limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users LIMIT 10',
        params: [],
      });
    });

    it('should add offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(5);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users OFFSET 5',
        params: [],
      });
    });

    it('should add both limit and offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(10).addOffset(5);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users LIMIT 10 OFFSET 5',
        params: [],
      });
    });

    it('should ignore zero limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addLimit(0);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users',
        params: [],
      });
    });

    it('should throw RangeError for negative limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(-1)).toThrow(RangeError);
    });

    it('should throw TypeError for non-integer limit', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(1.5)).toThrow(TypeError);
    });

    it('should throw RangeError for exceeding MAX_LIMIT', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addLimit(2000)).toThrow(RangeError);
    });

    it('should ignore zero offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.addOffset(0);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users',
        params: [],
      });
    });

    it('should throw RangeError for negative offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addOffset(-1)).toThrow(RangeError);
    });

    it('should throw TypeError for non-integer offset', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      expect(() => builder.addOffset(1.5)).toThrow(TypeError);
    });

    it('should ignore null or undefined limit', () => {
      const builder1 = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder1.addLimit(null);
      expect(builder1.build().sql).not.toContain('LIMIT');

      const builder2 = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder2.addLimit(undefined);
      expect(builder2.build().sql).not.toContain('LIMIT');
    });

    it('should ignore null or undefined offset', () => {
      const builder1 = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder1.addOffset(null);
      expect(builder1.build().sql).not.toContain('OFFSET');

      const builder2 = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder2.addOffset(undefined);
      expect(builder2.build().sql).not.toContain('OFFSET');
    });
  });

  describe('static from()', () => {
    it('should create a new instance with base SQL', () => {
      const builder = SqlBuilder.from<TestTable>('users');
      expect(builder).toBeInstanceOf(SqlBuilder);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users',
        params: [],
      });
    });
  });

  describe('column mapping', () => {
    it('should map field names using columnMapping', () => {
      const columnMapping = {
        id: 'user_id',
        name: 'user_name',
      };
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users', columnMapping);
      builder.whereEquals('id', 1).whereEquals('name', 'raian');

      const result = builder.build();
      expect(result.sql).toContain('user_id = $1');
      expect(result.sql).toContain('user_name = $2');
      expect(result.params).toEqual([1, 'raian']);
    });

    it('should use MapperBuilder generated mapper (simulated)', () => {
      const columnMapping = {
        id: 'user_id',
        name: 'user_name',
      };
      const builder = new SqlBuilder<any>('SELECT * FROM users', columnMapping);
      builder.whereEquals('id', 1).whereLike('name', 'A%');

      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (user_id = $1) AND (user_name LIKE $2)',
        params: [1, 'A%'],
      });
    });
  });

  describe('debug methods', () => {
    it('should return string representation via toString()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active');
      const debug = builder.toString();
      expect(debug).toContain('SqlBuilder');
      expect(debug).toContain('where: [1 clauses]');
    });

    it('should return JSON representation via toJSON()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEquals('status', 'active').addLimit(10);
      const json = builder.toJSON();
      expect(json.base).toBe('SELECT * FROM users');
      expect(json.limit).toBe(10);
      expect(json.sql).toContain('LIMIT 10');
    });
  });

  describe('clone()', () => {
    it('should return a new instance with same state', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereEquals('status', 'active')
        .addOrder('asc', 'name')
        .addGroup('age')
        .addLimit(10)
        .addOffset(5);

      const cloned = builder.clone();
      expect(cloned).not.toBe(builder);
      expect(cloned.build()).toEqual(builder.build());
      expect(cloned.toJSON()).toEqual(builder.toJSON());
    });
    describe('configurable limits', () => {
      it('should allow overriding maxWhereClauses', () => {
        const config = { maxWhereClauses: 2 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.whereEquals('id', 1).whereEquals('status', 'active');

        expect(() => builder.whereEquals('age', 25)).toThrow(RangeError);
      });

      it('should allow overriding maxOrderByClauses', () => {
        const config = { maxOrderByClauses: 1 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.addOrder('asc', 'name');

        expect(() => builder.addOrder('desc', 'age')).toThrow(RangeError);
      });

      it('should allow overriding maxGroupByClauses', () => {
        const config = { maxGroupByClauses: 1 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        builder.addGroup('status');

        expect(() => builder.addGroup('age')).toThrow(RangeError);
      });

      it('should allow overriding maxLimit', () => {
        const config = { maxLimit: 50 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);

        expect(() => builder.addLimit(51)).toThrow(RangeError);
        builder.addLimit(50); // Should pass
        expect(builder.build().sql).toContain('LIMIT 50');
      });

      it('should preserve config in clone()', () => {
        const config = { maxLimit: 5 };
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users', undefined, config);
        const cloned = builder.clone();

        expect(() => cloned.addLimit(6)).toThrow(RangeError);
      });
    });
  });

  describe('static count()', () => {
    it('should create a count query instance', () => {
      const builder = SqlBuilder.count<TestTable>('users');
      expect(builder).toBeInstanceOf(SqlBuilder);
      expect(builder.build()).toEqual({
        sql: 'SELECT COUNT(*) as count FROM users',
        params: [],
      });
    });
  });

  describe('additional where methods', () => {
    it('should handle whereClauses with multiple clauses', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereClauses([
        new ClauseEquals('status', 'active'),
        new ClauseEquals('active', true),
      ]);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (status = $1) AND (active = $2)',
        params: ['active', true],
      });
    });

    it('should handle whereBetweenOperator', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereBetweenOperator('age', { gte: 18, lte: 65 });
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (age BETWEEN $1 AND $2)',
        params: [18, 65],
      });
    });

    it('should handle whereConditions and whereCondition', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereConditions({
        status: { equals: 'active' }, // 'eq' não é um operador válido — 'equals' é o correto
        age: { gt: 18 },
      });
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE ((status = $1)) AND ((age > $2))',
        params: ['active', 18],
      });
    });

    it('should handle whereNotIn', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereNotIn('status', ['inactive', 'deleted']);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (NOT status IN ($1, $2))',
        params: ['inactive', 'deleted'],
      });
    });

    it('should handle whereNotILike', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereNotILike('name', '%admin%');
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (name NOT ILIKE $1)',
        params: ['%admin%'],
      });
    });

    it('should handle whereAnd', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereAnd(new ClauseEquals('status', 'active'), new ClauseEquals('active', true));
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE ((status = $1 AND active = $2))',
        params: ['active', true],
      });
    });

    it('should handle whereArrayIsContainedBy', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereArrayIsContainedBy('tags', ['user', 'admin']);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (tags <@ ARRAY[$1, $2])',
        params: ['user', 'admin'],
      });
    });

    it('should handle whereArrayOverlap', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereArrayOverlap('tags', ['user', 'guest']);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (tags && ARRAY[$1, $2])',
        params: ['user', 'guest'],
      });
    });

    it('should handle whereEmpty', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereEmpty('name');
      expect(builder.build()).toEqual({
        sql: "SELECT * FROM users WHERE (name IS NULL OR name = '')",
        params: [],
      });
    });
  });

  describe('new features, safety and DX improvements', () => {
    it('should support parameterized whereRaw to prevent SQL injection', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereRaw('age > ? AND status = ?', [18, 'active']);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (age > $1 AND status = $2)',
        params: [18, 'active'],
      });
    });

    it('should reset builder to its original state using reset()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder
        .whereEquals('status', 'active')
        .addOrder('asc', 'name')
        .addGroup('status')
        .addLimit(10)
        .addOffset(5);

      expect(builder.build().sql).toContain('WHERE');

      builder.reset();

      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users',
        params: [],
      });
    });

    it('should support toSQL() as a semantic alias for build()', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users').whereEquals('id', 1);
      expect(builder.toSQL()).toEqual(builder.build());
    });

    it('should return human-readable interpolated SQL using buildRaw() for debugging', () => {
      const date = new Date('2026-05-22T00:00:00.000Z');
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users')
        .whereEquals('name', "O'Connor")
        .whereGreaterThan('created_at', date)
        .whereEquals('active', true)
        .whereIn('tags', ['admin', 'moderator']);

      const raw = builder.buildRaw();
      expect(raw).toContain("name = 'O''Connor'");
      expect(raw).toContain(`created_at > '${date.toISOString()}'`);
      expect(raw).toContain('active = true');
      expect(raw).toContain("tags IN ('admin', 'moderator')");
    });

    it('should clone dynamically and preserve the exact subclass instance (polymorphism)', () => {
      class CustomSqlBuilder<T> extends SqlBuilder<T> {
        customMethod() {
          return 'custom';
        }
      }

      const original = new CustomSqlBuilder<TestTable>('SELECT * FROM users');
      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(CustomSqlBuilder);
      expect(cloned.customMethod()).toBe('custom');
    });

    it('should perform deep-like cloning allowing independent mutations', () => {
      const original = new SqlBuilder<TestTable>('SELECT * FROM users').whereEquals(
        'status',
        'active'
      );
      const cloned = original.clone();

      cloned.whereEquals('age', 18);

      expect(original.build().sql).not.toContain('age =');
      expect(cloned.build().sql).toContain('age =');
    });

    it('should support primitive boolean type in whereIn', () => {
      const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
      builder.whereIn('active', [true, false]);
      expect(builder.build()).toEqual({
        sql: 'SELECT * FROM users WHERE (active IN ($1, $2))',
        params: [true, false],
      });
    });

    describe('whereCursor', () => {
      it('should bypass cursor building if cursor is undefined or null', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users').whereCursor(null, [
          { field: 'id', direction: 'asc' },
        ]);
        expect(builder.build().sql).toBe('SELECT * FROM users');
      });

      it('should build cursor filter from a decoded object for a single column', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users').whereCursor({ id: 42 }, [
          { field: 'id', direction: 'asc' },
        ]);

        expect(builder.build()).toEqual({
          sql: 'SELECT * FROM users WHERE (id > $1)',
          params: [42],
        });
      });

      it('should build cursor filter from a Base64 string for multiple columns', () => {
        const cursorData = { created_at: '2026-05-22', id: 100 };
        const cursorBase64 = Buffer.from(JSON.stringify(cursorData)).toString('base64');

        const builder = new SqlBuilder<TestTable>('SELECT * FROM users').whereCursor(cursorBase64, [
          { field: 'created_at', direction: 'desc' },
          { field: 'id', direction: 'asc' },
        ]);

        const result = builder.build();
        expect(result.sql).toBe(
          'SELECT * FROM users WHERE ((created_at < $1) OR (created_at = $3 AND id > $2))'
        );
        expect(result.params).toEqual(['2026-05-22', 100, '2026-05-22']);
      });

      it('should build cursor filter from a Base64 string with nested values structure (CursorPayload)', () => {
        const cursorData = {
          values: { created_at: '2026-05-22', id: 100 },
          direction: 'next',
          orderBy: { created_at: 'desc', id: 'asc' },
        };
        const cursorBase64 = Buffer.from(JSON.stringify(cursorData)).toString('base64');

        const builder = new SqlBuilder<TestTable>('SELECT * FROM users').whereCursor(cursorBase64, [
          { field: 'created_at', direction: 'desc' },
          { field: 'id', direction: 'asc' },
        ]);

        const result = builder.build();
        expect(result.sql).toBe(
          'SELECT * FROM users WHERE ((created_at < $1) OR (created_at = $3 AND id > $2))'
        );
        expect(result.params).toEqual(['2026-05-22', 100, '2026-05-22']);
      });

      it('should respect columnMapper when building cursor column names', () => {
        const mapper = { createdAt: 'created_at', userId: 'user_id' };
        interface MappedTable {
          createdAt: Date;
          userId: number;
        }

        const builder = new SqlBuilder<MappedTable>('SELECT * FROM users', mapper).whereCursor(
          { createdAt: '2026-05-22', userId: 15 },
          [
            { field: 'createdAt', direction: 'desc' },
            { field: 'userId', direction: 'asc' },
          ]
        );

        const result = builder.build();
        expect(result.sql).toBe(
          'SELECT * FROM users WHERE ((created_at < $1) OR (created_at = $3 AND user_id > $2))'
        );
      });

      it('should throw error when cursor base64 has invalid format', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        expect(() =>
          builder.whereCursor('!!!invalid_base64!!!', [{ field: 'id', direction: 'asc' }])
        ).toThrow('Invalid cursor encoding');
      });

      it('should throw error when cursor object is missing a required order field', () => {
        const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
        expect(() =>
          builder.whereCursor({ created_at: '2026-05-22' }, [
            { field: 'created_at', direction: 'desc' },
            { field: 'id', direction: 'asc' },
          ])
        ).toThrow('Cursor is missing value for field: id');
      });
    });
  });
});
