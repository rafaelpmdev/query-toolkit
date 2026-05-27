import { describe, expect, it } from 'vitest';
import { PrimitiveValue } from './primitive-value';

describe('PrimitiveValue', () => {
  describe('toSql', () => {
    describe('string values', () => {
      it('should format simple string with quotes', () => {
        const value = new PrimitiveValue('test');
        expect(value.toSql()).toBe("'test'");
      });

      it('should escape single quotes by doubling them', () => {
        const value = new PrimitiveValue("O'Brien");
        expect(value.toSql()).toBe("'O''Brien'");
      });

      it('should escape backslashes', () => {
        const value = new PrimitiveValue('path\\to\\file');
        expect(value.toSql()).toBe("'path\\\\to\\\\file'");
      });

      it('should remove null bytes', () => {
        const value = new PrimitiveValue('test\0value');
        expect(value.toSql()).toBe("'testvalue'");
      });

      it('should handle empty string', () => {
        const value = new PrimitiveValue('');
        expect(value.toSql()).toBe("''");
      });

      it('should throw error for SQL injection with comments', () => {
        const value = new PrimitiveValue('test -- DROP TABLE');
        expect(() => value.toSql()).toThrow('SQL injection detected');
      });

      it('should throw error for SQL injection with UNION', () => {
        const value = new PrimitiveValue('test UNION SELECT password');
        expect(() => value.toSql()).toThrow('SQL injection detected');
      });

      it('should throw error for SQL injection with OR 1=1', () => {
        const value = new PrimitiveValue("' OR 1=1");
        expect(() => value.toSql()).toThrow('SQL injection detected');
      });
    });

    describe('number values', () => {
      it('should format positive integer', () => {
        const value = new PrimitiveValue(123);
        expect(value.toSql()).toBe('123');
      });

      it('should format negative integer', () => {
        const value = new PrimitiveValue(-456);
        expect(value.toSql()).toBe('-456');
      });

      it('should format decimal number', () => {
        const value = new PrimitiveValue(123.456);
        expect(value.toSql()).toBe('123.456');
      });

      it('should format zero', () => {
        const value = new PrimitiveValue(0);
        expect(value.toSql()).toBe('0');
      });

      it('should throw error for NaN', () => {
        const value = new PrimitiveValue(NaN);
        expect(() => value.toSql()).toThrow('NaN and Infinity are not allowed');
      });

      it('should throw error for Infinity', () => {
        const value = new PrimitiveValue(Infinity);
        expect(() => value.toSql()).toThrow('NaN and Infinity are not allowed');
      });

      it('should throw error for negative Infinity', () => {
        const value = new PrimitiveValue(-Infinity);
        expect(() => value.toSql()).toThrow('NaN and Infinity are not allowed');
      });
    });

    describe('boolean values', () => {
      it('should format true', () => {
        const value = new PrimitiveValue(true);
        expect(value.toSql()).toBe('true');
      });

      it('should format false', () => {
        const value = new PrimitiveValue(false);
        expect(value.toSql()).toBe('false');
      });
    });

    describe('date values', () => {
      it('should format date in ISO format', () => {
        const date = new Date('2024-01-15T10:30:00.000Z');
        const value = new PrimitiveValue(date);
        expect(value.toSql()).toBe(`'${date.toISOString()}'`);
      });

      it('should format date at year boundary', () => {
        const date = new Date('2024-12-31T23:59:59.000Z');
        const value = new PrimitiveValue(date);
        expect(value.toSql()).toBe(`'${date.toISOString()}'`);
      });

      it('should format date at start of year', () => {
        const date = new Date('2024-01-01T00:00:00.000Z');
        const value = new PrimitiveValue(date);
        expect(value.toSql()).toBe(`'${date.toISOString()}'`);
      });
    });

    describe('null and undefined', () => {
      it('should return undefined for null', () => {
        const value = new PrimitiveValue(null);
        expect(value.toSql()).toBeUndefined();
      });

      it('should return undefined for undefined', () => {
        const value = new PrimitiveValue(undefined);
        expect(value.toSql()).toBeUndefined();
      });
    });
  });

  describe('getValue', () => {
    it('should return the raw string value', () => {
      const value = new PrimitiveValue('test');
      expect(value.getValue()).toBe('test');
    });

    it('should return the raw number value', () => {
      const value = new PrimitiveValue(123);
      expect(value.getValue()).toBe(123);
    });

    it('should return the raw boolean value', () => {
      const value = new PrimitiveValue(true);
      expect(value.getValue()).toBe(true);
    });

    it('should return the raw date value', () => {
      const date = new Date('2024-01-15');
      const value = new PrimitiveValue(date);
      expect(value.getValue()).toBe(date);
    });

    it('should return null for null value', () => {
      const value = new PrimitiveValue(null);
      expect(value.getValue()).toBeNull();
    });
  });

  describe('type checking methods', () => {
    describe('isString', () => {
      it('should return true for string', () => {
        const value = new PrimitiveValue('test');
        expect(value.isString()).toBe(true);
      });

      it('should return false for number', () => {
        const value = new PrimitiveValue(123);
        expect(value.isString()).toBe(false);
      });

      it('should return false for boolean', () => {
        const value = new PrimitiveValue(true);
        expect(value.isString()).toBe(false);
      });

      it('should return false for date', () => {
        const value = new PrimitiveValue(new Date());
        expect(value.isString()).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for number', () => {
        const value = new PrimitiveValue(123);
        expect(value.isNumber()).toBe(true);
      });

      it('should return false for string', () => {
        const value = new PrimitiveValue('test');
        expect(value.isNumber()).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should return true for boolean', () => {
        const value = new PrimitiveValue(true);
        expect(value.isBoolean()).toBe(true);
      });

      it('should return false for string', () => {
        const value = new PrimitiveValue('test');
        expect(value.isBoolean()).toBe(false);
      });
    });

    describe('isDate', () => {
      it('should return true for Date object', () => {
        const value = new PrimitiveValue(new Date());
        expect(value.isDate()).toBe(true);
      });

      it('should return false for string', () => {
        const value = new PrimitiveValue('2024-01-15');
        expect(value.isDate()).toBe(false);
      });

      it('should return false for number', () => {
        const value = new PrimitiveValue(123);
        expect(value.isDate()).toBe(false);
      });
    });

    describe('isValidDate', () => {
      it('should return true for Date object', () => {
        const value = new PrimitiveValue(new Date());
        expect(value.isValidDate()).toBe(true);
      });

      it('should return true for valid date string', () => {
        const value = new PrimitiveValue('2024-01-15');
        expect(value.isValidDate()).toBe(true);
      });

      it('should return false for invalid date string', () => {
        const value = new PrimitiveValue('not a date');
        expect(value.isValidDate()).toBe(false);
      });

      it('should return false for number', () => {
        const value = new PrimitiveValue(123);
        expect(value.isValidDate()).toBe(false);
      });
    });
  });
});
