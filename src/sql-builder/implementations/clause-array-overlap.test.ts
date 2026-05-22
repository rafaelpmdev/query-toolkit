import { describe, expect, it } from 'vitest';
import { ClauseArrayOverlap } from './clause-array-overlap';

describe('ClauseArrayOverlap', () => {
  it('should build SQL with && operator and parameters', () => {
    const clause = new ClauseArrayOverlap('tags', ['a', 'b']);
    expect(clause.build()).toEqual({
      sql: 'tags && ARRAY[$1, $2]',
      params: ['a', 'b'],
    });
  });

  it('should return undefined for empty array', () => {
    const clause = new ClauseArrayOverlap('field', []);
    expect(clause.build()).toBeUndefined();
  });
});
