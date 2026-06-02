import { CursorPage, QueryParamsPrismaConverter } from '@raicampos/query-toolkit';
import { prisma } from '../../database';
import { CreateCoffeeData } from '../dto/create-coffee-data';
import { Coffee } from '../entities/coffee';
import { CoffeeMapper } from './coffee-mapper';
import { ICoffeeRepository, ListCoffeesParams, ListCoffeesResult } from './coffee.repository';


/**
 * Implementação Prisma do repositório de cafés
 */
export class CoffeeRepositoryPrisma implements ICoffeeRepository {

  async list(queryParams: ListCoffeesParams): Promise<ListCoffeesResult> {
    const filterParams = (queryParams.params || {}) as Record<string, unknown>;

    const sort = queryParams.sort;
    const pagination = queryParams.pagination || new CursorPage(20);

    const converter = new QueryParamsPrismaConverter(filterParams);
    const query = converter.build();
    const orderBy = converter.sort(sort);

    const cursor = pagination.decode();
    const rawData = await prisma.coffee.findMany({
      where: query,
      orderBy,
      take: pagination.limit + 1,
      cursor: cursor?.values?.id ? { id: Number(cursor.values.id) } : undefined,
      skip: cursor?.values ? 1 : 0,
    });

    const result = CursorPage.processResult(
      rawData,
      pagination.limit,
      'next',
      orderBy as unknown as Record<string, 'asc' | 'desc'>,
      !!pagination.cursor
    );

    return {
      data: CoffeeMapper.create().toDomainList(result.data),
      pagination: new CursorPage(pagination.limit, pagination.cursor, result.prevCursor, result.nextCursor)
    };
  }

  async findById(id: number): Promise<Coffee | null> {
    const prismaCoffee = await prisma.coffee.findUnique({ where: { id } });
    if (!prismaCoffee) return null;
    return new CoffeeMapper().toDomain(prismaCoffee);
  }

  async create(data: CreateCoffeeData): Promise<Coffee> {
    const prismaCoffee = await prisma.coffee.create({ data });
    return new CoffeeMapper().toDomain(prismaCoffee);
  }
}
