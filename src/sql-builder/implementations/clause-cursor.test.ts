import { describe, expect, it } from 'vitest';
import { ClauseCursor } from './clause-cursor';

describe('ClauseCursor', () => {
  it('should build a single-column cursor clause with asc direction', () => {
    const clause = new ClauseCursor([{ column: 'id', value: 42, direction: 'asc' }]);

    const result = clause.build({ startParamIndex: 1 });

    expect(result).toEqual({
      sql: 'id > $1',
      params: [42],
    });
  });

  it('should build a single-column cursor clause with desc direction', () => {
    const clause = new ClauseCursor([
      { column: 'created_at', value: '2026-05-22', direction: 'desc' },
    ]);

    const result = clause.build({ startParamIndex: 5 });

    expect(result).toEqual({
      sql: 'created_at < $5',
      params: ['2026-05-22'],
    });
  });

  it('should build a multi-column cursor clause and preserve correct param indexes', () => {
    const clause = new ClauseCursor([
      { column: 'created_at', value: '2026-05-22', direction: 'desc' },
      { column: 'id', value: 100, direction: 'asc' },
    ]);

    const result = clause.build({ startParamIndex: 1 });

    expect(result?.sql).toBe('(created_at < $1) OR (created_at = $3 AND id > $2)');
    expect(result?.params).toEqual(['2026-05-22', 100, '2026-05-22']);
  });

  it('should throw error when items array is empty', () => {
    expect(() => new ClauseCursor([])).toThrow('Cursor items must not be empty');
  });
});
