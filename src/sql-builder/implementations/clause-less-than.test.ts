import { describe, expect, it } from 'vitest';
import { ClauseLessThan } from './clause-less-than';

describe('ClauseLessThan', () => {
  describe('build', () => {
    describe('number values', () => {
      it('should generate less than clause for positive number', () => {
        const clause = new ClauseLessThan('age', 65);
        expect(clause.build()).toEqual({
          sql: 'age < $1',
          params: [65],
        });
      });

      it('should generate less than clause for negative number', () => {
        const clause = new ClauseLessThan('temperature', 0);
        expect(clause.build()).toEqual({
          sql: 'temperature < $1',
          params: [0],
        });
      });
    });

    describe('date values', () => {
      it('should generate less than clause for date', () => {
        const date = new Date('2024-01-15T10:30:00.000Z');
        const clause = new ClauseLessThan('created_at', date);
        expect(clause.build()).toEqual({
          sql: 'created_at < $1',
          params: [date],
        });
      });
    });

    describe('invalid types', () => {
      it('should return undefined for string value', () => {
        const clause = new ClauseLessThan('field', 'invalid' as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseLessThan('field', false as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseLessThan('age', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseLessThan('age', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseLessThan('', 25)).toThrow('Field is required');
      });
    });
  });
});
