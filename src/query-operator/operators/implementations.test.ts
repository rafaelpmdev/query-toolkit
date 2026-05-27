import { describe, expect, it, vi } from 'vitest';
import { ArrayContainsOperator } from './array-contains-operator';
import { ArrayIsContainedByOperator } from './array-is-contained-by-operator';
import { ArrayOverlapOperator } from './array-overlap-operator';
import { BetweenOperator } from './between-operator';
import { ContainsOperator } from './contains-operator';
import { EqualsOperator } from './equals-operator';
import { GreaterThanOperator } from './greater-than-operator';
import { GreaterThanOrEqualsOperator } from './greater-than-or-equals-operator';
import { InOperator } from './in-operator';
import { LessThanOperator } from './less-than-operator';
import { LessThanOrEqualOperator } from './less-than-or-equals-operator';
import { NotContainsOperator } from './not-contains-operator';
import { NotEqualsOperator } from './not-equals-operator';
import { NotInOperator } from './not-in-operator';

describe('Query Operators Implementations', () => {
  const mockVisitor = {
    visitArrayContains: vi.fn(),
    visitArrayIsContainedBy: vi.fn(),
    visitArrayOverlap: vi.fn(),
    visitContains: vi.fn(),
    visitNotContains: vi.fn(),
    visitGreaterThan: vi.fn(),
    visitGreaterThanOrEquals: vi.fn(),
    visitLessThan: vi.fn(),
    visitLessThanOrEquals: vi.fn(),
    visitNotEquals: vi.fn(),
    visitIn: vi.fn(),
    visitNotIn: vi.fn(),
    visitBetween: vi.fn(),
    visitEquals: vi.fn(),
  } as any;

  describe('ArrayContainsOperator', () => {
    it('should parse array values and query', () => {
      const op = new ArrayContainsOperator('@>v1,v2');
      expect(op.value()).toEqual(['v1', 'v2']);
      expect(op.query()).toEqual({ arrayContains: ['v1', 'v2'] });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitArrayContains).toHaveBeenCalled();
    });
  });

  describe('ArrayIsContainedByOperator', () => {
    it('should parse array values and query', () => {
      const op = new ArrayIsContainedByOperator('<@v1,v2');
      expect(op.value()).toEqual(['v1', 'v2']);
      expect(op.query()).toEqual({ arrayIsContainedBy: ['v1', 'v2'] });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitArrayIsContainedBy).toHaveBeenCalled();
    });
  });

  describe('ArrayOverlapOperator', () => {
    it('should parse array values and query', () => {
      const op = new ArrayOverlapOperator('&&v1,v2');
      expect(op.value()).toEqual(['v1', 'v2']);
      expect(op.query()).toEqual({ arrayOverlap: ['v1', 'v2'] });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitArrayOverlap).toHaveBeenCalled();
    });
  });

  describe('ContainsOperator', () => {
    it('should parse value and query', () => {
      const op = new ContainsOperator('~=value');
      expect(op.value()).toBe('value');
      expect(op.query()).toEqual({ contains: 'value' });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitContains).toHaveBeenCalled();
    });
  });

  describe('NotContainsOperator', () => {
    it('should parse value and query', () => {
      const op = new NotContainsOperator('!~=value');
      expect(op.value()).toBe('value');
      expect(op.query()).toEqual({ notContains: 'value' });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitNotContains).toHaveBeenCalled();
    });
  });

  describe('GreaterThanOperator', () => {
    it('should parse number value and query', () => {
      const op = new GreaterThanOperator('gt=18');
      expect(op.value()).toBe(18);
      expect(op.query()).toEqual({ gt: 18 });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitGreaterThan).toHaveBeenCalled();
    });
  });

  describe('GreaterThanOrEqualsOperator', () => {
    it('should parse number value and query', () => {
      const op = new GreaterThanOrEqualsOperator('gte=18');
      expect(op.value()).toBe(18);
      expect(op.query()).toEqual({ gte: 18 });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitGreaterThanOrEquals).toHaveBeenCalled();
    });
  });

  describe('LessThanOperator', () => {
    it('should parse number value and query', () => {
      const op = new LessThanOperator('lt=65');
      expect(op.value()).toBe(65);
      expect(op.query()).toEqual({ lt: 65 });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitLessThan).toHaveBeenCalled();
    });
  });

  describe('LessThanOrEqualOperator', () => {
    it('should parse number value and query', () => {
      const op = new LessThanOrEqualOperator('lte=65');
      expect(op.value()).toBe(65);
      expect(op.query()).toEqual({ lte: 65 });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitLessThanOrEquals).toHaveBeenCalled();
    });
  });

  describe('NotEqualsOperator', () => {
    it('should parse value and query', () => {
      const op = new NotEqualsOperator('!=value');
      expect(op.value()).toBe('value');
      expect(op.query()).toEqual({ notEquals: 'value' });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitNotEquals).toHaveBeenCalled();
    });
  });

  describe('InOperator', () => {
    it('should parse array values and query', () => {
      const op = new InOperator(['v1', 'v2']);
      expect(op.value()).toEqual(['v1', 'v2']);
      expect(op.query()).toEqual({ in: ['v1', 'v2'] });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitIn).toHaveBeenCalled();
    });
  });

  describe('NotInOperator', () => {
    it('should parse array values and query', () => {
      const op = new NotInOperator(['v1', 'v2']);
      expect(op.value()).toEqual(['v1', 'v2']);
      expect(op.query()).toEqual({ notIn: ['v1', 'v2'] });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitNotIn).toHaveBeenCalled();
    });
  });

  describe('BetweenOperator', () => {
    it('should parse range values and query', () => {
      const op = new BetweenOperator('btw=10,20');
      expect(op.value()).toEqual([10, 20]);
      expect(op.query()).toEqual({ gte: 10, lte: 20 });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitBetween).toHaveBeenCalled();
    });
  });

  describe('EqualsOperator', () => {
    it('should parse value and query', () => {
      const op = new EqualsOperator('==value');
      expect(op.value()).toBe('value');
      expect(op.query()).toEqual({ equals: 'value' });
      op.accept(mockVisitor, 'field');
      expect(mockVisitor.visitEquals).toHaveBeenCalled();
    });
  });
});
