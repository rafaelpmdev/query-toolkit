import { describe, expect, it } from 'vitest';
import { ClauseIsEmpty } from './clause-is-empty';

describe('ClauseIsEmpty', () => {
  describe('build', () => {
    it('should generate IS NULL or empty string SQL format', () => {
      const clause = new ClauseIsEmpty('name');
      expect(clause.build()).toEqual({
        sql: "name IS NULL OR name = ''",
        params: [],
      });
    });
  });
});
