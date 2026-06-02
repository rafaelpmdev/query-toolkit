import { isNullOrUndefined } from '@raicamposs/toolkit';
import { z } from 'zod';
import { DateRsqlRegex } from './date-regex';

const BOOL_STRINGS = new Set(['TRUE', 'FALSE', 'S', 'N']);

/**
 * Centralized utility for parsing RSQL values (dates, numbers, booleans, strings)
 */
export function parseRsqlValue(value: string): string | number | boolean | Date {
  if (isNullOrUndefined(value)) return value;

  // Try parsing as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }

  // Try parsing as date
  if (DateRsqlRegex.test(value)) {
    try {
      return z.coerce.date().parse(value);
    } catch {
      return value;
    }
  }

  // Try parsing as boolean
  if (value?.trim()?.length > 0 && BOOL_STRINGS.has(value.toUpperCase().trim())) {
    return value.toUpperCase().trim() === 'TRUE' || value.toUpperCase().trim() === 'S';
  }

  return value;
}

/**
 * @deprecated Use parseRsqlValue instead
 */
export const parseRsqlDate = parseRsqlValue;
