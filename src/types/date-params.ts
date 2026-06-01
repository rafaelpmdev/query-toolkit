import { isAssigned } from '@raicampos/toolkit';
import { z } from 'zod';
import { BaseParamSchema } from './base-params';

const regexDateFlutter = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/;

const DatetimeIsoSchema = z.iso.datetime({ local: true }).refine((date) => {
  const [, month, day] = date.split('-');
  if (month === '2' && Number(day) > 29) return false;
  return true;
});

const DateIsoSchema = z.iso.date().refine((date) => {
  const [, month, day] = date.split('-');
  if (month === '2' && Number(day) > 29) return false;
  return true;
});

const dateTypesSchema = z
  .union([
    z
      .string()
      .regex(regexDateFlutter)
      .transform((dateString) => {
        const match = RegExp(regexDateFlutter).exec(dateString);
        if (!match) return dateString;
        const [, year, month, day, hour, minute, second, ms] = match;
        const newFormat = `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}`;
        return newFormat;
      })
      .pipe(DatetimeIsoSchema),
    DatetimeIsoSchema,
    DateIsoSchema,
    z.date(),
  ])
  .pipe(z.coerce.date());

export const DateSchema = dateTypesSchema.pipe(z.date().min(new Date('1900-01-01')));

export const DateParamSchema = BaseParamSchema.pipe(
  z
    .object({
      equals: DateSchema.optional(),
      notEquals: DateSchema.optional(),
      gt: DateSchema.optional(),
      gte: DateSchema.optional(),
      lt: DateSchema.optional(),
      lte: DateSchema.optional(),
      in: DateSchema.array().nonempty().optional(),
      notIn: DateSchema.array().nonempty().optional(),
    })
    .strict()
);

export const BetweenDateParamSchema = z
  .object({
    gte: DateSchema,
    lte: DateSchema,
  })
  .refine(({ gte, lte }) => gte <= lte, {
    message: 'gte must be less than or equal to lte',
  });

export type BetweenDateParam = z.infer<typeof BetweenDateParamSchema>;

export const CustomDateParamSchema = z
  .object({
    gt: DateSchema.optional(),
    gte: DateSchema.optional(),
    lt: DateSchema.optional(),
    lte: DateSchema.optional(),
  })
  .refine(
    ({ gte, lte, gt, lt }) =>
      (isAssigned(gte) || isAssigned(gt)) && (isAssigned(lte) || isAssigned(lt)),
    {
      message: 'gte must be less than or equal to lte',
    }
  )
  .refine(
    ({ gte, lte, gt, lt }) => {
      const start = gte ?? gt;
      const end = lte ?? lt;
      if (start === undefined || end === undefined) return false;
      return start <= end;
    },
    {
      message: 'Start date must be less than or equal to end date',
      path: ['gte', 'lte'],
    }
  );

export type CustomDateParam = z.infer<typeof CustomDateParamSchema>;
