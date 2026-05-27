import { describe, expect, it } from 'vitest';
import { ClauseExists } from './clause-exists';

describe('ClauseExists', () => {
  describe('build', () => {
    it('should generate correct EXISTS SQL for valid SELECT subquery', () => {
      const sql = 'SELECT 1 FROM users WHERE active = true';
      const clause = new ClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `EXISTS (${sql})`,
        params: [],
      });
    });

    it('should handle complex subqueries', () => {
      const sql = "SELECT id FROM orders WHERE user_id = users.id AND status = 'completed'";
      const clause = new ClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `EXISTS (${sql})`,
        params: [],
      });
    });

    it('should trim whitespace from SQL', () => {
      const sql = '  SELECT 1 FROM users WHERE active = true  ';
      const clause = new ClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `EXISTS (${sql.trim()})`,
        params: [],
      });
    });

    it('should return undefined for empty string', () => {
      const clause = new ClauseExists('');
      const result = clause.build();

      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace-only string', () => {
      const clause = new ClauseExists('   ');
      const result = clause.build();

      expect(result).toBeUndefined();
    });

    it('should throw error for SQL without SELECT', () => {
      const clause = new ClauseExists('DELETE FROM users');

      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should throw error for non-SELECT statements', () => {
      const clause = new ClauseExists('UPDATE users SET active = false');

      expect(() => clause.build()).toThrow('EXISTS clause requires a SELECT subquery');
    });

    it('should be case-insensitive for SELECT validation', () => {
      const clause = new ClauseExists('select 1 from users');
      const result = clause.build();

      expect(result).toEqual({
        sql: 'EXISTS (select 1 from users)',
        params: [],
      });
    });

    it('should detect SQL injection with comments', () => {
      const clause = new ClauseExists('SELECT 1 FROM users -- DROP TABLE users');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with UNION', () => {
      const clause = new ClauseExists('SELECT 1 FROM users UNION SELECT password FROM admin');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with OR 1=1', () => {
      const clause = new ClauseExists('SELECT 1 FROM users WHERE id = 1 OR 1=1');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should detect SQL injection with semicolon and DROP', () => {
      const clause = new ClauseExists('SELECT 1 FROM users; DROP TABLE users');

      expect(() => clause.build()).toThrow('SQL injection detected');
    });

    it('should handle SELECT with asterisk', () => {
      const clause = new ClauseExists("SELECT * FROM users WHERE role = 'admin'");
      const result = clause.build();

      expect(result).toEqual({
        sql: "EXISTS (SELECT * FROM users WHERE role = 'admin')",
        params: [],
      });
    });

    it('should handle SELECT with JOIN', () => {
      const sql = 'SELECT u.id FROM users u JOIN orders o ON u.id = o.user_id';
      const clause = new ClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `EXISTS (${sql})`,
        params: [],
      });
    });

    it('should handle SELECT with subquery', () => {
      const sql = 'SELECT id FROM users WHERE id IN (SELECT user_id FROM orders)';
      const clause = new ClauseExists(sql);
      const result = clause.build();

      expect(result).toEqual({
        sql: `EXISTS (${sql})`,
        params: [],
      });
    });
  });
});
