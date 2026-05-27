import { describe, expect, it } from 'vitest';
import { ClauseNotExists } from './clause-not-exists';

describe('ClauseNotExists', () => {
  describe('build', () => {
    it('should generate correct NOT EXISTS SQL for valid SELECT subquery', () => {
      const sql = 'SELECT 1 FROM users WHERE active = false';
      const clause = new ClauseNotExists(sql);
      expect(clause.build()).toEqual({
        sql: `NOT EXISTS (${sql})`,
        params: [],
      });
    });

    it('should handle complex subqueries with NOT prefix', () => {
      const sql = "SELECT id FROM orders WHERE user_id = users.id AND status = 'cancelled'";
      const clause = new ClauseNotExists(sql);
      expect(clause.build()).toEqual({
        sql: `NOT EXISTS (${sql})`,
        params: [],
      });
    });

    it('should trim whitespace from SQL', () => {
      const sql = '  SELECT 1 FROM inactive_users  ';
      const clause = new ClauseNotExists(sql);
      expect(clause.build()).toEqual({
        sql: `NOT EXISTS (${sql.trim()})`,
        params: [],
      });
    });

    it('should return undefined for empty string', () => {
      const clause = new ClauseNotExists('');
      expect(clause.build()).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      const clause = new ClauseNotExists('   ');
      expect(clause.build()).toBeUndefined();
    });

    it('should throw error for SQL without SELECT', () => {
      const clause = new ClauseNotExists("INSERT INTO users VALUES (1, 'test')");
      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should throw error for non-SELECT statements', () => {
      const clause = new ClauseNotExists('CREATE TABLE test (id INT)');
      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should be case-insensitive for SELECT validation', () => {
      const clause = new ClauseNotExists('SeLeCt 1 from users');
      expect(clause.build()).toEqual({
        sql: 'NOT EXISTS (SeLeCt 1 from users)',
        params: [],
      });
    });

    it('should detect SQL injection with comments', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users -- malicious comment');
      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with UNION', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users UNION SELECT * FROM passwords');
      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with OR 1=1', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users WHERE active = false OR 1=1');
      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with AND 1=1', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users WHERE id = 1 AND 1=1');
      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with multi-line comments', () => {
      const clause = new ClauseNotExists('SELECT 1 FROM users /* comment */');
      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should handle SELECT with WHERE clause', () => {
      const sql = 'SELECT id FROM deleted_users WHERE deleted_at IS NOT NULL';
      const clause = new ClauseNotExists(sql);
      expect(clause.build()).toEqual({
        sql: `NOT EXISTS (${sql})`,
        params: [],
      });
    });
  });
});
