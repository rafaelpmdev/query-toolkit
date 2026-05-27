import { describe, expect, it } from 'vitest';
import { ClauseExistsBase } from './clause-exists-base';

// Concrete implementation for testing the abstract base class
class TestClauseExists extends ClauseExistsBase {
  protected getPrefix(): string {
    return 'TEST_';
  }
}

describe('ClauseExistsBase', () => {
  describe('build', () => {
    it('should use the prefix from getPrefix method', () => {
      const clause = new TestClauseExists('SELECT 1 FROM test_table');
      const result = clause.build();

      expect(result).toEqual({
        sql: 'TEST_ EXISTS (SELECT 1 FROM test_table)',
        params: [],
      });
    });

    it('should validate SELECT requirement', () => {
      const clause = new TestClauseExists('UPDATE test SET value = 1');

      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should trim SQL before validation', () => {
      const sql = '   SELECT 1   ';
      const clause = new TestClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `TEST_ EXISTS (${sql.trim()})`,
        params: [],
      });
    });

    it('should return undefined for empty SQL', () => {
      const clause = new TestClauseExists('');
      const result = clause.build();

      expect(result).toBeUndefined();
    });

    it('should check for SQL injection patterns', () => {
      const clause = new TestClauseExists('SELECT 1; DROP TABLE users');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should include truncated SQL in error message for long queries', () => {
      const longSql = 'SELECT ' + 'x'.repeat(100) + ' FROM table';
      const clause = new TestClauseExists(longSql);

      try {
        clause.build();
      } catch (error) {
        expect((error as Error).message).toContain('...');
      }
    });

    it('should handle SELECT in different cases', () => {
      const testCases = ['SELECT 1', 'select 1', 'SeLeCt 1', 'SELECT 1'];

      testCases.forEach((sql) => {
        const clause = new TestClauseExists(sql);
        expect(() => clause.build()).not.toThrow();
      });
    });

    it('should reject non-SELECT statements', () => {
      const invalidStatements = [
        'INSERT INTO users VALUES (1)',
        'UPDATE users SET active = true',
        'DELETE FROM users',
        'DROP TABLE users',
        'CREATE TABLE test (id INT)',
        'ALTER TABLE users ADD COLUMN email VARCHAR(255)',
        'TRUNCATE TABLE users',
      ];

      invalidStatements.forEach((sql) => {
        const clause = new TestClauseExists(sql);
        expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
      });
    });

    it('should detect various SQL injection patterns', () => {
      const injectionPatterns = [
        'SELECT 1 -- comment',
        'SELECT 1 /* comment */',
        'SELECT 1 UNION SELECT 2',
        'SELECT 1 WHERE 1=1 OR 1=1',
        'SELECT 1 WHERE 1=1 AND 1=1',
        'SELECT 1; DROP TABLE users',
      ];

      injectionPatterns.forEach((sql) => {
        const clause = new TestClauseExists(sql);
        expect(() => clause.build()).toThrow('SQL injection detected');
      });
    });

    it('should preserve original SQL in output', () => {
      const sql = 'SELECT id, name, email FROM users WHERE active = true';
      const clause = new TestClauseExists(sql);
      const result = clause.build();

      expect(result?.sql).toContain(sql);
    });

    it('should handle SQL with line breaks', () => {
      const sql = `SELECT id
        FROM users
        WHERE active = true`;
      const clause = new TestClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `TEST_ EXISTS (${sql})`,
        params: [],
      });
    });
  });

  describe('inheritance', () => {
    it('should allow subclasses to define custom prefixes', () => {
      class CustomClause extends ClauseExistsBase {
        protected getPrefix(): string {
          return 'CUSTOM_PREFIX_';
        }
      }

      const clause = new CustomClause('SELECT 1');
      const result = clause.build();

      expect(result).toEqual({
        sql: 'CUSTOM_PREFIX_ EXISTS (SELECT 1)',
        params: [],
      });
    });

    it('should allow empty prefix', () => {
      class NoPrefixClause extends ClauseExistsBase {
        protected getPrefix(): string {
          return '';
        }
      }

      const clause = new NoPrefixClause('SELECT 1');
      const result = clause.build();

      expect(result).toEqual({
        sql: 'EXISTS (SELECT 1)',
        params: [],
      });
    });
  });
});
