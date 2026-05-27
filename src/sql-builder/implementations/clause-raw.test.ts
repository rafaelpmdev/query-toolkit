import { describe, expect, it } from 'vitest';
import { ClauseRaw } from './clause-raw';

describe('ClauseRaw', () => {
  describe('build', () => {
    it('should pass through sql and params unchanged when no placeholders exist', () => {
      const clause = new ClauseRaw('active = true');
      expect(clause.build()).toEqual({
        sql: 'active = true',
        params: [],
      });
    });

    it('should replace question marks with incremental PostgreSQL placeholders starting from 1 by default', () => {
      const clause = new ClauseRaw('age > ? AND status = ?', [18, 'active']);
      expect(clause.build()).toEqual({
        sql: 'age > $1 AND status = $2',
        params: [18, 'active'],
      });
    });

    it('should respect custom startParamIndex', () => {
      const clause = new ClauseRaw('age > ? AND status = ?', [18, 'active']);
      expect(clause.build({ startParamIndex: 3 })).toEqual({
        sql: 'age > $3 AND status = $4',
        params: [18, 'active'],
      });
    });
  });
});
