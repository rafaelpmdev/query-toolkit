import { describe, expect, it } from 'vitest';
import { ClauseEmpty } from './clause-empty';

describe('ClauseEmpty', () => {
  describe('build', () => {
    it('should return undefined', () => {
      const clause = new ClauseEmpty();
      expect(clause.build()).toBeUndefined();
    });

    it('should return undefined even with parameter options passed', () => {
      const clause = new ClauseEmpty();
      expect(clause.build({ startParamIndex: 5 })).toBeUndefined();
    });
  });
});
