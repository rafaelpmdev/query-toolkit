import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Instância singleton do PrismaClient.
 * Aplicando o Princípio da Responsabilidade Única (SRP): este módulo
 * tem a única responsabilidade de fornecer a conexão com o banco de dados.
 * 
 * Para o Prisma 7, é utilizado o Driver Adapter PG para conexões de alta performance.
 */
const connectionString = process.env['DATABASE_URL'];
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Pool PG puro para operações que não usam ORM.
 * Disponível para services que utilizam SQL parametrizado nativo.
 */
export { pool, prisma };

