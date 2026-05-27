import { describe, expect, it } from 'vitest';
import { ClauseNotEquals } from './clause-not-equals';

describe('ClauseNotEquals', () => {
  describe('build', () => {
    describe('string values', () => {
      it('should generate not equals clause for string', () => {
        const clause = new ClauseNotEquals('name', 'John');
        expect(clause.build()).toEqual({
          sql: 'name <> $1',
          params: ['John'],
        });
      });
    });

    describe('number values', () => {
      it('should generate not equals clause for number', () => {
        const clause = new ClauseNotEquals('age', 25);
        expect(clause.build()).toEqual({
          sql: 'age <> $1',
          params: [25],
        });
      });
    });

    describe('boolean values', () => {
      it('should generate not equals clause for true', () => {
        const clause = new ClauseNotEquals('active', true);
        expect(clause.build()).toEqual({
          sql: 'active <> $1',
          params: [true],
        });
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseNotEquals('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseNotEquals('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseNotEquals('', 'value')).toThrow('Field is required');
      });
    });
  });
});
