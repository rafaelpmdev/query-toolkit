import { describe, expect, it } from 'vitest';
import { ClauseLessThanOrEquals } from './clause-less-than-or-equals';

describe('ClauseLessThanOrEquals', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate less than or equals clause for number', () => {
        const clause = new ClauseLessThanOrEquals('age', 65);
        expect(clause.build()).toEqual({
          sql: 'age <= $1',
          params: [65],
        });
      });

      it('should handle zero', () => {
        const clause = new ClauseLessThanOrEquals('balance', 0);
        expect(clause.build()).toEqual({
          sql: 'balance <= $1',
          params: [0],
        });
      });

      it('should handle negative numbers', () => {
        const clause = new ClauseLessThanOrEquals('temperature', -10);
        expect(clause.build()).toEqual({
          sql: 'temperature <= $1',
          params: [-10],
        });
      });
    });

    describe('date values', () => {
      it('should generate less than or equals clause for date', () => {
        const date = new Date('2024-12-31T23:59:59.000Z');
        const clause = new ClauseLessThanOrEquals('expires_at', date);
        expect(clause.build()).toEqual({
          sql: 'expires_at <= $1',
          params: [date],
        });
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseLessThanOrEquals('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseLessThanOrEquals('field', false as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseLessThanOrEquals('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseLessThanOrEquals('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseLessThanOrEquals('', 65)).toThrow('Field is required');
      });
    });
  });
});
