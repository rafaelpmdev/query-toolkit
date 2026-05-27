import { roundABNT } from '@raicamposs/toolkit';
import { describe, expect, it } from 'vitest';
import { ClauseCondition } from './clause-condition';

describe('ClauseCondition', () => {
  describe('build', () => {
    describe('equals condition', () => {
      it('should generate equals clause from condition object', () => {
        const clause = new ClauseCondition('status', { equals: 'active' });
        expect(clause.build()).toEqual({
          sql: '(status = $1)',
          params: ['active'],
        });
      });

      it('should handle number equals', () => {
        const clause = new ClauseCondition('age', { equals: 25 });
        expect(clause.build()).toEqual({
          sql: '(age = $1)',
          params: [25],
        });
      });

      it('should handle boolean equals', () => {
        const clause = new ClauseCondition('active', { equals: true });
        expect(clause.build()).toEqual({
          sql: '(active = $1)',
          params: [true],
        });
      });

      it('should handle date equals', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const clause = new ClauseCondition('created_at', { equals: date });
        expect(clause.build()).toEqual({
          sql: '(created_at = $1)',
          params: [date],
        });
      });
    });

    describe('notEquals condition', () => {
      it('should generate not equals clause', () => {
        const clause = new ClauseCondition('status', { notEquals: 'inactive' });
        expect(clause.build()).toEqual({
          sql: '(status <> $1)',
          params: ['inactive'],
        });
      });

      it('should handle number not equals', () => {
        const clause = new ClauseCondition('age', { notEquals: 0 });
        expect(clause.build()).toEqual({
          sql: '(age <> $1)',
          params: [0],
        });
      });
    });

    describe('comparison conditions', () => {
      it('should generate greater than clause', () => {
        const clause = new ClauseCondition('age', { gt: 18 });
        expect(clause.build()).toEqual({
          sql: '(age > $1)',
          params: [18],
        });
      });

      it('should generate greater than or equals clause', () => {
        const clause = new ClauseCondition('age', { gte: 18 });
        expect(clause.build()).toEqual({
          sql: '(age >= $1)',
          params: [18],
        });
      });

      it('should generate less than clause', () => {
        const clause = new ClauseCondition('age', { lt: 65 });
        expect(clause.build()).toEqual({
          sql: '(age < $1)',
          params: [65],
        });
      });

      it('should generate less than or equals clause', () => {
        const clause = new ClauseCondition('age', { lte: 65 });
        expect(clause.build()).toEqual({
          sql: '(age <= $1)',
          params: [65],
        });
      });
    });

    describe('contains conditions', () => {
      it('should generate contains clause for string', () => {
        const clause = new ClauseCondition('name', { contains: 'John' });
        expect(clause.build()).toEqual({
          sql: '(name ilike $1)',
          params: ['%John%'],
        });
      });

      it('should generate notContains clause for string', () => {
        const clause = new ClauseCondition('name', { notContains: 'test' });
        expect(clause.build()).toEqual({
          sql: '(not name ilike $1)',
          params: ['%test%'],
        });
      });
    });

    describe('in and notIn conditions', () => {
      it('should generate IN clause', () => {
        const clause = new ClauseCondition('status', { in: ['active', 'pending', 'completed'] });
        expect(clause.build()).toEqual({
          sql: '(status in ($1, $2, $3))',
          params: ['active', 'pending', 'completed'],
        });
      });

      it('should generate NOT IN clause', () => {
        const clause = new ClauseCondition('status', { notIn: ['deleted', 'archived'] });
        expect(clause.build()).toEqual({
          sql: '(not status in ($1, $2))',
          params: ['deleted', 'archived'],
        });
      });
    });

    describe('array conditions', () => {
      it('should generate arrayContains clause', () => {
        const clause = new ClauseCondition('tags', { arrayContains: ['javascript', 'typescript'] });
        const result = clause.build();
        expect(result?.sql).toContain('CASE');
        expect(result?.sql).toContain('@>');
        expect(result?.sql).toContain('$1');
        expect(result?.sql).toContain('$2');
        expect(result?.params).toEqual(['javascript', 'typescript']);
      });

      it('should generate arrayIsContainedBy clause', () => {
        const clause = new ClauseCondition('tags', { arrayIsContainedBy: ['all', 'tags'] });
        const result = clause.build();
        expect(result?.sql).toContain('CASE');
        expect(result?.sql).toContain('<@');
        expect(result?.sql).toContain('$1');
        expect(result?.sql).toContain('$2');
        expect(result?.params).toEqual(['all', 'tags']);
      });

      it('should generate arrayOverlap clause', () => {
        const clause = new ClauseCondition('tags', { arrayOverlap: ['react', 'vue'] });
        const result = clause.build();
        expect(result?.sql).toContain('CASE');
        expect(result?.sql).toContain('&&');
        expect(result?.sql).toContain('$1');
        expect(result?.sql).toContain('$2');
        expect(result?.params).toEqual(['react', 'vue']);
      });

      it('should handle unknown operator type in buildWhere', () => {
        const clause = new ClauseCondition('field', { unknown: 'val' } as any);
        expect(clause.build()).toEqual({
          sql: '(field = $1)',
          params: ['val'],
        });
      });
    });

    describe('multiple conditions', () => {
      it('should combine multiple conditions with AND', () => {
        const clause = new ClauseCondition('age', { gte: 18, lte: 65 });
        expect(clause.build()).toEqual({
          sql: '(age >= $1) AND (age <= $2)',
          params: [18, 65],
        });
      });

      it('should filter out undefined conditions', () => {
        const clause = new ClauseCondition('value', { equals: null as any, gt: 5 });
        expect(clause.build()).toEqual({
          sql: '(value > $1)',
          params: [5],
        });
      });
    });

    describe('value transformation', () => {
      it('should apply transformation to single value', () => {
        const clause = new ClauseCondition('price', { equals: 100 }, (value) =>
          roundABNT((value as number) * 1.1, 2)
        );
        expect(clause.build()).toEqual({
          sql: '(price = $1)',
          params: [110],
        });
      });
    });

    describe('direct value (non-object)', () => {
      it('should treat direct string value as equals', () => {
        const clause = new ClauseCondition('status', 'active' as any);
        expect(clause.build()).toEqual({
          sql: 'status = $1',
          params: ['active'],
        });
      });

      it('should treat Date object as equals', () => {
        const date = new Date('2024-01-15T10:30:00Z');
        const clause = new ClauseCondition('created_at', date as any);
        expect(clause.build()).toEqual({
          sql: 'created_at = $1',
          params: [date],
        });
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null field', () => {
        const clause = new ClauseCondition(null as any, { equals: 'value' });
        expect(clause.build()).toBeUndefined();
      });

      it('should return undefined for null condition', () => {
        const clause = new ClauseCondition('field', null as any);
        expect(clause.build()).toBeUndefined();
      });
    });
  });
});
