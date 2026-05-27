import { describe, expect, it } from 'vitest';
import { ClauseIn } from './clause-in';

describe('ClauseIn', () => {
  describe('build', () => {
    describe('string arrays', () => {
      it('should generate IN clause for string array', () => {
        const clause = new ClauseIn('status', ['active', 'pending', 'completed']);
        expect(clause.build()).toEqual({
          sql: 'status IN ($1, $2, $3)',
          params: ['active', 'pending', 'completed'],
        });
      });

      it('should handle single string value', () => {
        const clause = new ClauseIn('status', ['active']);
        expect(clause.build()).toEqual({
          sql: 'status IN ($1)',
          params: ['active'],
        });
      });
    });

    describe('number arrays', () => {
      it('should generate IN clause for number array', () => {
        const clause = new ClauseIn('id', [1, 2, 3, 4, 5]);
        expect(clause.build()).toEqual({
          sql: 'id IN ($1, $2, $3, $4, $5)',
          params: [1, 2, 3, 4, 5],
        });
      });
    });

    describe('empty and null handling', () => {
      it('should return undefined for empty array', () => {
        const clause = new ClauseIn('status', []);
        expect(clause.build()).toBeUndefined();
      });

      it('should filter out null values', () => {
        const clause = new ClauseIn('id', [1, null, 2, null, 3] as any);
        expect(clause.build()).toEqual({
          sql: 'id IN ($1, $2, $3)',
          params: [1, 2, 3],
        });
      });

      it('should return undefined for array with only null/undefined', () => {
        const clause = new ClauseIn('id', [null, undefined] as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseIn('', [1, 2, 3])).toThrow('Field is required');
      });
    });
  });
});
