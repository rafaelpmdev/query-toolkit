import { isNullOrUndefined } from '@raicampos/toolkit';
import { z } from 'zod';
import { DateRsqlRegex } from './date-regex';

/**
 * Centralized utility for parsing RSQL values (dates, numbers, strings)
 */
export function parseRsqlValue(value: string): string | number | Date {
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

  return value;
}

/**
 * @deprecated Use parseRsqlValue instead
 */
export const parseRsqlDate = parseRsqlValue;
