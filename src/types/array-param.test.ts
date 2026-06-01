import { isAssigned } from '@raicampos/toolkit';
import { describe, expect, it } from 'vitest';
import { ArrayParamsSchema } from './array-param';

describe('ArrayParamsSchema', () => {
  it('should return Array Is Contained By', () => {
    const value = {
      arrayIsContainedBy: ['BOLO'],
    };

    const parsed = ArrayParamsSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return Array Overlap', () => {
    const value = {
      arrayOverlap: ['BOLO'],
    };

    const parsed = ArrayParamsSchema.parse(value);
    expect(parsed).toEqual(value);
  });

  it('should return Array Contains', () => {
    const value = {
      arrayContains: ['A', 'AA', 'AAA', 'AAA A'],
    };

    const parsed = ArrayParamsSchema.parse(value);

    expect(parsed).toBeDefined();
    expect(parsed['arrayContains']).toBeDefined();
    const { arrayContains } = parsed;

    expect(arrayContains).toBeDefined();
    expect(arrayContains).toHaveLength(4);

    if (isAssigned(arrayContains)) {
      expect(arrayContains[0]).toEqual('A');
      expect(arrayContains[1]).toEqual('AA');
      expect(arrayContains[2]).toEqual('AAA');
      expect(arrayContains[3]).toEqual('AAA A');
    }
  });

  it('should return Array Contains Boolean', () => {
    const value = {
      arrayContains: [true, false, 'true', 'false', 'TRUE', 'FALSE'],
    };

    const parsed = ArrayParamsSchema.parse(value);

    expect(parsed).toBeDefined();
    expect(parsed['arrayContains']).toBeDefined();
    const { arrayContains } = parsed;

    expect(arrayContains).toBeDefined();
    expect(arrayContains).toHaveLength(6);

    if (isAssigned(arrayContains)) {
      expect(arrayContains[0]).toBe(true);
      expect(arrayContains[1]).toBe(false);
      expect(arrayContains[2]).toBe(true);
      expect(arrayContains[3]).toBe(false);
      expect(arrayContains[4]).toBe(true);
      expect(arrayContains[5]).toBe(false);
    }
  });

  it('should return Array Contains Number', () => {
    const value = {
      arrayContains: [1, 11, 1111, 11111, Number('0011')],
    };

    const parsed = ArrayParamsSchema.parse(value);

    expect(parsed).toBeDefined();
    expect(parsed['arrayContains']).toBeDefined();
    const { arrayContains } = parsed;

    expect(arrayContains).toBeDefined();
    expect(arrayContains).toHaveLength(5);

    if (isAssigned(arrayContains)) {
      expect(arrayContains[0]).toEqual(1);
      expect(arrayContains[1]).toEqual(11);
      expect(arrayContains[2]).toEqual(1111);
      expect(arrayContains[3]).toEqual(11111);
      expect(arrayContains[4]).toEqual(11);
    }
  });

  it('should return Array Contains Date', () => {
    const dateNow = new Date(Date.now());
    const value = {
      arrayContains: [dateNow, new Date('2024-02-23'), '2024-02-01', '2024-02-01T00:00:00.000Z'],
    };

    const parsed = ArrayParamsSchema.parse(value);

    expect(parsed).toBeDefined();
    expect(parsed['arrayContains']).toBeDefined();
    const { arrayContains } = parsed;

    expect(arrayContains).toBeDefined();
    expect(arrayContains).toHaveLength(4);

    if (isAssigned(arrayContains)) {
      expect(arrayContains[0]).toEqual(dateNow);
      expect(arrayContains[1]).toEqual(new Date('2024-02-23'));
      expect(arrayContains[2]).toEqual(new Date('2024-02-01'));
      expect(arrayContains[3]).toEqual(new Date('2024-02-01T00:00:00.000Z'));
    }
  });
});
