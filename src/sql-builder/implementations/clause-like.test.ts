import { describe, expect, it } from 'vitest';
import { ClauseLike } from './clause-like';

describe('ClauseLike', () => {
  describe('build', () => {
    describe('string patterns', () => {
      it('should generate LIKE clause for simple pattern', () => {
        const clause = new ClauseLike('name', 'John%');
        expect(clause.build()).toEqual({
          sql: 'name LIKE $1',
          params: ['John%'],
        });
      });

      it('should handle wildcard at start', () => {
        const clause = new ClauseLike('email', '%@example.com');
        expect(clause.build()).toEqual({
          sql: 'email LIKE $1',
          params: ['%@example.com'],
        });
      });
    });

    describe('non-string values', () => {
      it('should return undefined for number value', () => {
        const clause = new ClauseLike('field', 123 as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseLike('field', true as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseLike('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseLike('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseLike('', 'pattern')).toThrow('Field is required');
      });
    });
  });
});
