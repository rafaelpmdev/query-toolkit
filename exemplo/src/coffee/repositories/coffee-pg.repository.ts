/**
 * PG Repository Implementation
 *
 * Implementação usando cliente PostgreSQL nativo (node-pg) para máxima performance.
 * Útil para: queries críticas de performance, SQL customizado, operações em batch
 */

import { Coffee } from '@prisma/client';
import { ObjectEntries } from '@raicampos/oolkit';
import {
  CursorPage,
  QueryParamsSqlConverter,
  SqlBuilder,
  applyCursor,
} from '@raicampos/query-toolkit';
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
  async list(queryParams: ListCoffeesParams): Promise<ListCoffeesResult> {
    const filterParams = (queryParams.params || {}) as Record<string, unknown>;

    const sort = queryParams.sort;
    const pagination = queryParams.pagination || new CursorPage(20);

    const converter = new QueryParamsSqlConverter(filterParams);
    const query = converter.build();
    const orderBy = converter.sort(sort);

    const builder = SqlBuilder.from<Coffee>('coffee');
    for (const [, clauses] of ObjectEntries(query)) {
      builder.whereClauses(clauses);
    }

    const payload = pagination.decode();
    const direction = payload?.direction ?? 'next';

    applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage: pagination,
      orderBy: orderBy as Record<string, 'asc' | 'desc'>,
    });

    const { sql, params: sqlParams } = builder.build();
    const dataResult = await pool.query(sql, sqlParams);

    const result = CursorPage.processResult(
      dataResult.rows as Coffee[],
      pagination.limit,
      direction,
      orderBy as Record<string, 'asc' | 'desc'>,
      !!pagination.cursor
    );

    return {
      data: result.data,
      pagination: new CursorPage(pagination.limit, pagination.cursor, result.prevCursor, result.nextCursor),
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

