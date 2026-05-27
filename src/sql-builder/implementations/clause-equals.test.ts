import { describe, expect, it } from 'vitest';
import { ClauseEquals } from './clause-equals';

describe('ClauseEquals', () => {
  describe('build', () => {
    describe('string values', () => {
      it('should generate equals clause for string', () => {
        const clause = new ClauseEquals('name', 'John');
        expect(clause.build()).toEqual({
          sql: 'name = $1',
          params: ['John'],
        });
      });

      it('should handle empty string', () => {
        const clause = new ClauseEquals('name', '');
        expect(clause.build()).toEqual({
          sql: 'name = $1',
          params: [''],
        });
      });
    });

    describe('number values', () => {
      it('should generate equals clause for positive number', () => {
        const clause = new ClauseEquals('age', 25);
        expect(clause.build()).toEqual({
          sql: 'age = $1',
          params: [25],
        });
      });

      it('should generate equals clause for negative number', () => {
        const clause = new ClauseEquals('balance', -100);
        expect(clause.build()).toEqual({
          sql: 'balance = $1',
          params: [-100],
        });
      });
    });

    describe('boolean values', () => {
      it('should generate equals clause for true', () => {
        const clause = new ClauseEquals('active', true);
        expect(clause.build()).toEqual({
          sql: 'active = $1',
          params: [true],
        });
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseEquals('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseEquals('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseEquals('', 'value')).toThrow('Field is required');
      });

      it('should throw error for null field', () => {
        expect(() => new ClauseEquals(null as any, 'value')).toThrow('Field is required');
      });
    });
  });
});
