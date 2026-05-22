import { QueryParamsPrismaConverter } from '@raicamposs/query-toolkit';
import { prisma } from '../../database';
import { CreateCoffeeData } from '../dto/create-coffee-data';
import { Coffee } from '../entities/coffee';
import { CoffeeMapper } from './coffee-mapper';
import { ICoffeeRepository, ListCoffeesParams, ListCoffeesResult } from './coffee.repository';


/**
 * Implementação Prisma do repositório de cafés
 */
export class CoffeeRepositoryPrisma implements ICoffeeRepository {

  async list(params: ListCoffeesParams): Promise<ListCoffeesResult> {
    const { limit, offset, sort: _sort, ...filters } = params;
    const converter = new QueryParamsPrismaConverter(filters);
    const query = converter.build();

    const [data, total] = await Promise.all([
      prisma.coffee.findMany({
        where: query,
        take: limit,
        skip: offset,
      }),
      prisma.coffee.count({
        where: query,
      })
    ]);

    return {
      data: CoffeeMapper.create().toDomainList(data),
      limit,
      offset,
      total,
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

