import { describe, expect, it } from 'vitest';
import { ClauseAnd } from './clause-and';
import { ClauseEquals } from './clause-equals';

describe('ClauseAnd', () => {
  describe('addClause method', () => {
    it('should return the clause instance for chaining', () => {
      const clause1 = new ClauseEquals('status', 'active');
      const andClause = new ClauseAnd(clause1);

      const result = andClause.addClause(new ClauseEquals('role', 'admin'));
      expect(result).toBe(andClause);
    });
  });

  describe('build', () => {
    it('should build parameterized query with AND join', () => {
      const clause1 = new ClauseEquals('status', 'active');
      const clause2 = new ClauseEquals('role', 'admin');
      const andClause = new ClauseAnd(clause1, clause2);

      const result = andClause.build();
      expect(result).toEqual({
        sql: '(status = $1 AND role = $2)',
        params: ['active', 'admin'],
      });
    });

    it('should handle index shifting', () => {
      const clause1 = new ClauseEquals('status', 'active');
      const clause2 = new ClauseEquals('role', 'admin');
      const andClause = new ClauseAnd(clause1, clause2);

      const result = andClause.build({ startParamIndex: 3 });
      expect(result).toEqual({
        sql: '(status = $3 AND role = $4)',
        params: ['active', 'admin'],
      });
    });

    it('should return plain SQL without parentheses for single sub-clause', () => {
      const clause = new ClauseEquals('status', 'active');
      const andClause = new ClauseAnd(clause);

      const result = andClause.build();
      expect(result).toEqual({
        sql: 'status = $1',
        params: ['active'],
      });
    });

    it('should return undefined when all clauses are undefined', () => {
      const clause1 = new ClauseEquals('value1', null as any);
      const clause2 = new ClauseEquals('value2', undefined as any);
      const andClause = new ClauseAnd(clause1, clause2);

      expect(andClause.build()).toBeUndefined();
    });

    it('should return undefined for empty clause array', () => {
      const andClause = new ClauseAnd();
      expect(andClause.build()).toBeUndefined();
    });
  });
});
