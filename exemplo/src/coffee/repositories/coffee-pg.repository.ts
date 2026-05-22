/**
 * PG Repository Implementation
 *
 * Implementação usando cliente PostgreSQL nativo (node-pg) para máxima performance.
 * Útil para: queries críticas de performance, SQL customizado, operações em batch
 */

import { Coffee } from '@prisma/client';
import { QueryParamsSqlConverter, SqlBuilder } from '@raicamposs/query-toolkit';
import { pool } from '../../database';
import { CreateCoffeeData } from '../dto/create-coffee-data';
import type {
  ICoffeeRepository,
  ListCoffeesParams,
  ListCoffeesResult,
} from './coffee.repository';

/**
 * Implementação PG puro do repositório de cafés
 */
export class CoffeeRepositoryPg implements ICoffeeRepository {
  async list(params: ListCoffeesParams): Promise<ListCoffeesResult> {
    const { limit, offset, sort: _sort, ...filters } = params;
    const converter = new QueryParamsSqlConverter(filters);
    const clauses = Object.values(converter.build()).flat();

    const builder = SqlBuilder.from<Coffee>('coffee')
      .whereClauses(clauses)
      .addLimit(limit)
      .addOffset(offset);

    const countBuilder = SqlBuilder.count<Coffee>('coffee')
      .whereClauses(clauses);

    const { sql, params: sqlParams } = builder.build();
    const { sql: countSql, params: countParams } = countBuilder.build();

    const [dataResult, countResult] = await Promise.all([
      pool.query(sql, sqlParams),
      pool.query(countSql, countParams)
    ]);

    const total = Number(countResult.rows[0]?.count || 0);

    return {
      data: dataResult.rows as Coffee[],
      limit,
      offset,
      total,
    };
  }

  async findById(id: number): Promise<Coffee | null> {
    const res = await pool.query('SELECT * FROM coffee WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return res.rows[0] as Coffee;
  }

  async create(data: CreateCoffeeData): Promise<Coffee> {
    const res = await pool.query(
      `INSERT INTO coffee (name, origin, roast, flavor, price, available, tags) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        data.name,
        data.origin,
        data.roast,
        data.flavor,
        data.price,
        data.available,
        data.tags
      ]
    );
    return res.rows[0] as Coffee;
  }
}

