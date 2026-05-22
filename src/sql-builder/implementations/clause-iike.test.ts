import { describe, expect, it } from 'vitest';
import { ClauseILike } from './clause-iike';

describe('ClauseILike', () => {
  describe('build', () => {
    describe('case-insensitive patterns', () => {
      it('should generate ILIKE clause for simple pattern', () => {
        const clause = new ClauseILike('name', 'john%');
        expect(clause.build()).toEqual({
          sql: 'name ILIKE $1',
          params: ['john%'],
        });
      });

      it('should handle wildcard at start', () => {
        const clause = new ClauseILike('email', '%@EXAMPLE.COM');
        expect(clause.build()).toEqual({
          sql: 'email ILIKE $1',
          params: ['%@EXAMPLE.COM'],
        });
      });
    });

    describe('non-string values', () => {
      it('should return undefined for number value', () => {
        const clause = new ClauseILike('field', 123 as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for boolean value', () => {
        const clause = new ClauseILike('field', false as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null value', () => {
        const clause = new ClauseILike('name', null as any);
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for undefined value', () => {
        const clause = new ClauseILike('name', undefined as any);
        expect(clause.build()).toBeUndefined();
      });
    });

    describe('field validation', () => {
      it('should throw error for empty field', () => {
        expect(() => new ClauseILike('', 'pattern')).toThrow('Field is required');
      });
    });
  });
});
