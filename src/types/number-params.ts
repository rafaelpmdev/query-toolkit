import { isEmpty } from '@raicampos/toolkit';
import { z } from 'zod';
import { BaseParamSchema } from './base-params';

export const NumberSchema = z
  .union([
    z.number(),
    z.string().transform((val) => {
      if (val === 'null' || isEmpty(val)) return null;
      if (isNaN(parseInt(val))) return val;
      return parseInt(val);
    }),
  ])
  .pipe(z.number());

export const NumberParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: NumberSchema.optional(),
      notEquals: NumberSchema.optional(),
      gt: NumberSchema.optional(),
      gte: NumberSchema.optional(),
      lt: NumberSchema.optional(),
      lte: NumberSchema.optional(),
      in: NumberSchema.array().nonempty().optional(),
      notIn: NumberSchema.array().nonempty().optional(),
    })
    .strict()
);
