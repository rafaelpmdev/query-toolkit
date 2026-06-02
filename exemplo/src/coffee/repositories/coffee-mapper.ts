import { Coffee as PrismaCoffee } from '@prisma/client';
import { mapAllOr } from '@raicampos/toolkit';
import { MapperBuilder } from '../../../../dist';
import { Coffee } from '../entities/coffee';

/**
 * Mapper para converter entre modelos de banco de dados do Prisma e entidades de domínio
 */

export const coffeeMapping = {
  id: 'id',
  name: 'name',
  origin: 'origin',
  roast: 'roast',
  flavor: 'flavor',
  price: 'price',
  available: 'available',
  tags: 'tags',
  createdAt: 'createdAt',
} as const;

export class CoffeeMapper {
  private mapper: MapperBuilder<PrismaCoffee, Coffee>;

  constructor() {
    this.mapper = new MapperBuilder<PrismaCoffee, Coffee>(coffeeMapping)
      .convertDateToIso('createdAt');
  }

  static create() {
    return new CoffeeMapper();
  }

  toDomain(prismaCoffee: PrismaCoffee): Coffee {
    return this.mapper.modelToEntity(prismaCoffee);
  }

  toModel(entity: Coffee): PrismaCoffee {
    return this.mapper.entityToModel(entity);
  }

  toModelList(entities: Coffee[]): PrismaCoffee[] {
    return mapAllOr(entities, (value) => this.toModel(value), []) as PrismaCoffee[];
  }

  toDomainList(entities: PrismaCoffee[]): Coffee[] {
    return mapAllOr(entities, (value) => this.toDomain(value), []) as Coffee[];
  }
}
