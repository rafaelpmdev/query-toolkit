import { describe, expect, it } from 'vitest';
import { ClauseGreaterThan } from './clause-greater-than';

describe('ClauseGreaterThan', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate greater than clause for positive number', () => {
        const clause = new ClauseGreaterThan('age', 25);
        expect(clause.build()).toEqual({
          sql: 'age > $1',
          params: [25],
        });
      });

      it('should generate greater than clause for negative number', () => {
        const clause = new ClauseGreaterThan('temperature', -10);
        expect(clause.build()).toEqual({
          sql: 'temperature > $1',
          params: [-10],
        });
      });

      it('should generate greater than clause for zero', () => {
        const clause = new ClauseGreaterThan('balance', 0);
        expect(clause.build()).toEqual({
          sql: 'balance > $1',
          params: [0],
        });
      });
    });

    describe('date values', () => {
      it('should generate greater than clause for date', () => {
        const date = new Date('2024-01-15T10:30:00.000Z');
        const clause = new ClauseGreaterThan('created_at', date);
        expect(clause.build()).toEqual({
          sql: 'created_at > $1',
          params: [date],
        });
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseGreaterThan('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseGreaterThan('field', true as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseGreaterThan('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseGreaterThan('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseGreaterThan('', 25)).toThrow('Field is required');
      });
    });
  });
});
