import { z } from 'zod';
/**
 * Schema de validação para criação de café via Zod.
 */


export const createCoffeeSchema = z.object({
  name: z.string().min(2).max(100),
  origin: z.string().min(2).max(100),
  roast: z.enum(['LIGHT', 'MEDIUM', 'DARK']),
  flavor: z.string().min(2).max(255),
  price: z.number().positive(),
  available: z.coerce.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
});


export type CreateCoffeeData = z.infer<typeof createCoffeeSchema>;
