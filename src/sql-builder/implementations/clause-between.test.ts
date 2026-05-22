import { describe, expect, it } from 'vitest';
import { ClauseBetween } from './clause-between';

describe('ClauseBetween', () => {
  describe('build', () => {
    describe('number ranges', () => {
      it('should generate BETWEEN clause for number range', () => {
        const clause = new ClauseBetween('age', 18, 65);
        expect(clause.build()).toEqual({
          sql: 'age BETWEEN $1 AND $2',
          params: [18, 65],
        });
      });

      it('should handle negative numbers', () => {
        const clause = new ClauseBetween('temperature', -10, 30);
        expect(clause.build()).toEqual({
          sql: 'temperature BETWEEN $1 AND $2',
          params: [-10, 30],
        });
      });

      it('should handle decimal numbers', () => {
        const clause = new ClauseBetween('price', 9.99, 99.99);
        expect(clause.build()).toEqual({
          sql: 'price BETWEEN $1 AND $2',
          params: [9.99, 99.99],
        });
      });

      it('should handle same start and end values', () => {
        const clause = new ClauseBetween('value', 5, 5);
        expect(clause.build()).toEqual({
          sql: 'value BETWEEN $1 AND $2',
          params: [5, 5],
        });
      });
    });

    describe('date ranges', () => {
      it('should generate BETWEEN clause for date range', () => {
        const start = new Date('2024-01-01T00:00:00Z');
        const end = new Date('2024-12-31T23:59:59Z');
        const clause = new ClauseBetween('created_at', start, end);
        expect(clause.build()).toEqual({
          sql: 'created_at BETWEEN $1 AND $2',
          params: [start, end],
        });
      });
    });

    describe('string ranges', () => {
      it('should generate BETWEEN clause for string range', () => {
        const clause = new ClauseBetween('name', 'A', 'M');
        expect(clause.build()).toEqual({
          sql: 'name BETWEEN $1 AND $2',
          params: ['A', 'M'],
        });
      });
    });

    describe('null and undefined', () => {
      it('should return undefined when start is null', () => {
        const clause = new ClauseBetween('age', null as any, 65);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when end is null', () => {
        const clause = new ClauseBetween('age', 18, null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when both are null', () => {
        const clause = new ClauseBetween('age', null as any, null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when start is undefined', () => {
        const clause = new ClauseBetween('age', undefined as any, 65);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined when end is undefined', () => {
        const clause = new ClauseBetween('age', 18, undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseBetween('', 1, 10)).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseBetween(null as any, 1, 10)).toThrow('Field is required');
      });

      it('should throw error for undefined field', () => {
        expect(() => new ClauseBetween(undefined as any, 1, 10)).toThrow('Field is required');
      });
    });
  });
});
