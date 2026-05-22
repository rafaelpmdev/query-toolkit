import { describe, expect, it } from 'vitest';
import { ClauseNotILike } from './clause-not-ilike';

describe('ClauseNotILike', () => {
  describe('build', () => {
    it('should return sql with $1 placeholder and params', () => {
      const clause = new ClauseNotILike('name', '%spam%');
      const result = clause.build();
      expect(result).toEqual({ sql: 'name NOT ILIKE $1', params: ['%spam%'] });
    });

    it('should respect startParamIndex', () => {
      const clause = new ClauseNotILike('email', '%@example.com');
      const result = clause.build({ startParamIndex: 3 });
      expect(result).toEqual({ sql: 'email NOT ILIKE $3', params: ['%@example.com'] });
    });

    it('should default to $1 when no option is provided', () => {
      const clause = new ClauseNotILike('description', '%unwanted%');
      const result = clause.build({});
      expect(result?.sql).toBe('description NOT ILIKE $1');
      expect(result?.params).toHaveLength(1);
    });

    it('should return undefined for null value', () => {
      const clause = new ClauseNotILike('name', null as any);
      expect(clause.build()).toBeUndefined();
    });

    it('should return undefined for undefined value', () => {
      const clause = new ClauseNotILike('name', undefined as any);
      expect(clause.build()).toBeUndefined();
    });

    it('should preserve wildcard characters as literal params (not SQL-escaped)', () => {
      const clause = new ClauseNotILike('name', '%O%');
      const result = clause.build();
      // O valor no params deve ser o raw, sem adição de aspas SQL
      expect(result?.params[0]).toBe('%O%');
    });
  });
});
