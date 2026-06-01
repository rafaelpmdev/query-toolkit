/**
 * In-Memory Repository Implementation
 *
 * Armazena dados em memória para testes, desenvolvimento e demonstração.
 * Útil para: testes unitários, prototipagem rápida, demonstrações
 *
 * Não é persistente - dados são perdidos ao reiniciar o servidor.
 */

import { Coffee } from "@prisma/client";
import { Nullable } from "@raicampos/oolkit";
import { CursorPage } from "@raicampos/query-toolkit";
import { CreateCoffeeData } from "../dto/create-coffee-data";
import { ICoffeeRepository, ListCoffeesParams, ListCoffeesResult } from "./coffee.repository";


/**
 * Implementação In-Memory do repositório de cafés
 */
export class CoffeeRepositoryMemory implements ICoffeeRepository {
  private coffees: Map<number, Coffee> = new Map();

  constructor() {
    this.seedData();
  }

  list(params: ListCoffeesParams): Promise<ListCoffeesResult> {
    const { pagination } = params;
    const limit = pagination?.limit ?? 20;

    let offset = 0;
    const all = Array.from(this.coffees.values());

    if (pagination && 'decode' in pagination && typeof pagination.decode === 'function') {
      const cursorObj = pagination.decode();
      if (cursorObj?.values?.id) {
        const decodedId = Number(cursorObj.values.id);
        const index = all.findIndex(c => c.id === decodedId);
        if (index !== -1) {
          offset = index + 1; // start after the cursor
        }
      }
    }

    const rawData = all.slice(offset, offset + limit + 1);

    const result = CursorPage.processResult(
      rawData,
      limit,
      'next',
      { id: 'asc' },
      !!pagination?.cursor
    );

    return Promise.resolve({
      data: result.data,
      pagination: new CursorPage(limit, pagination?.cursor, result.prevCursor, result.nextCursor)
    });
  }

  findById(id: number): Promise<Nullable<Coffee>> {
    if (!this.coffees.has(id)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.coffees.get(id));
  }

  create(data: CreateCoffeeData): Promise<Coffee> {
    const coffee: Coffee = {
      id: this.coffees.size + 1,
      name: data.name,
      origin: data.origin,
      roast: data.roast,
      flavor: data.flavor,
      price: data.price,
      available: data.available,
      tags: data.tags,
      createdAt: new Date(),
    }
    this.coffees.set(coffee.id, coffee);
    return Promise.resolve(coffee);
  }


  /**
   * Seed inicial com dados de exemplo
   */
  private seedData(): void {
    const initialData: CreateCoffeeData[] = [
      {
        name: 'Espresso',
        origin: 'Italy',
        roast: 'DARK',
        flavor: 'Bold and intense',
        price: 3.5,
        available: true,
        tags: ['short', 'strong'],
      },
      {
        name: 'Cappuccino',
        origin: 'Italy',
        roast: 'MEDIUM',
        flavor: 'Smooth with milk foam',
        price: 5.0,
        available: true,
        tags: ['milk', 'foam'],
      },
      {
        name: 'Americano',
        origin: 'USA',
        roast: 'MEDIUM',
        flavor: 'Diluted espresso',
        price: 4.0,
        available: true,
        tags: ['long', 'diluted'],
      },
      {
        name: 'Flat White',
        origin: 'Australia',
        roast: 'MEDIUM',
        flavor: 'Velvety microfoam',
        price: 5.5,
        available: true,
        tags: ['milk', 'smooth'],
      },
      {
        name: 'Macchiato',
        origin: 'Italy',
        roast: 'DARK',
        flavor: 'Espresso marked with milk',
        price: 4.5,
        available: true,
        tags: ['espresso', 'milk'],
      },
      {
        name: 'Mocha',
        origin: 'Yemen',
        roast: 'MEDIUM',
        flavor: 'Coffee with chocolate',
        price: 5.5,
        available: true,
        tags: ['chocolate', 'milk'],
      },
    ];

    for (const data of initialData) {
      const coffee: Coffee = {
        id: this.coffees.size + 1,
        name: data.name,
        origin: data.origin,
        roast: data.roast,
        flavor: data.flavor,
        price: data.price,
        available: data.available,
        tags: data.tags,
        createdAt: new Date(),
      }
      this.coffees.set(coffee.id, coffee);
    }
  }
}

