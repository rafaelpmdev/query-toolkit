import { describe, expect, it } from 'vitest';
import { ClauseArrayContains } from './clause-array-contains';

describe('ClauseArrayContains', () => {
  it('should build SQL with @> operator and parameters', () => {
    const clause = new ClauseArrayContains('tags', ['a', 'b']);
    expect(clause.build()).toEqual({
      sql: 'tags @> ARRAY[$1, $2]',
      params: ['a', 'b'],
    });
  });

  it('should return undefined for empty values', () => {
    const clause = new ClauseArrayContains('tags', []);
    expect(clause.build()).toBeUndefined();
  });
});
