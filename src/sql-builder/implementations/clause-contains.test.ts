import { describe, expect, it } from 'vitest';
import { ClauseContains } from './clause-contains';

describe('ClauseContains', () => {
  describe('build', () => {
    it('should return parameterized query with <@ operator (default)', () => {
      const clause = new ClauseContains('tags', ['javascript', 'typescript']);
      const result = clause.build();
      expect(result).toEqual({
        sql: 'array[tags]::text[] <@ array[$1, $2]',
        params: ['javascript', 'typescript'],
      });
    });

    it('should return parameterized query with @> operator', () => {
      const clause = new ClauseContains('tags', ['react', 'vue'], '@>');
      const result = clause.build();
      expect(result).toEqual({
        sql: 'array[tags]::text[] @> array[$1, $2]',
        params: ['react', 'vue'],
      });
    });

    it('should respect startParamIndex', () => {
      const clause = new ClauseContains('categories', ['tech', 'news']);
      const result = clause.build({ startParamIndex: 4 });
      expect(result).toEqual({
        sql: 'array[categories]::text[] <@ array[$4, $5]',
        params: ['tech', 'news'],
      });
    });

    it('should generate sequential placeholders for many values', () => {
      const clause = new ClauseContains('tags', ['a', 'b', 'c']);
      const result = clause.build({ startParamIndex: 2 });
      expect(result?.sql).toBe('array[tags]::text[] <@ array[$2, $3, $4]');
      expect(result?.params).toHaveLength(3);
    });

    it('should return undefined for empty array', () => {
      const clause = new ClauseContains('tags', []);
      expect(clause.build()).toBeUndefined();
    });

    it('should return undefined for array with only null/undefined', () => {
      const clause = new ClauseContains('tags', [null, undefined] as any);
      expect(clause.build()).toBeUndefined();
    });
  });
});
