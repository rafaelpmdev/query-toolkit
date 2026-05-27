import { describe, expect, it } from 'vitest';
import { ClauseNotIn } from './clause-not-in';

describe('ClauseNotIn', () => {
  describe('build', () => {
    it('should return parameterized query for string array', () => {
      const clause = new ClauseNotIn('status', ['active', 'pending']);
      const result = clause.build();
      expect(result).toEqual({
        sql: 'NOT status IN ($1, $2)',
        params: ['active', 'pending'],
      });
    });

    it('should return parameterized query for number array', () => {
      const clause = new ClauseNotIn('id', [1, 2, 3]);
      const result = clause.build();
      expect(result).toEqual({
        sql: 'NOT id IN ($1, $2, $3)',
        params: [1, 2, 3],
      });
    });

    it('should respect startParamIndex', () => {
      const clause = new ClauseNotIn('status', ['a', 'b']);
      const result = clause.build({ startParamIndex: 5 });
      expect(result).toEqual({
        sql: 'NOT status IN ($5, $6)',
        params: ['a', 'b'],
      });
    });

    it('should generate sequential placeholders starting from index', () => {
      const clause = new ClauseNotIn('type', ['x', 'y', 'z']);
      const result = clause.build({ startParamIndex: 2 });
      expect(result?.sql).toBe('NOT type IN ($2, $3, $4)');
      expect(result?.params).toHaveLength(3);
    });

    it('should return undefined for empty array', () => {
      const clause = new ClauseNotIn('status', []);
      expect(clause.build()).toBeUndefined();
    });
  });
});
