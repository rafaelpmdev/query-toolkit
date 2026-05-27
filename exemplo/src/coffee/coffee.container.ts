import { CoffeeRepositoryMemory } from './repositories/coffee-memory.repository';
import { CoffeeRepositoryPg } from './repositories/coffee-pg.repository';
import { CoffeeRepositoryPrisma } from './repositories/coffee-prisma.repository';
import { ICoffeeRepository } from './repositories/coffee.repository';
import { CreateCoffeeUseCase } from './usecases/create-coffee.usecase';
import { FindCoffeeByIdUseCase } from './usecases/find-coffee-by-id.usecase';
import { ListCoffeesUseCase } from './usecases/list-coffees.usecase';

export class CoffeeContainer {

  constructor(
    private readonly coffeeRepository: ICoffeeRepository
  ) { }

  static get prismaInstance(): CoffeeContainer {
    return new CoffeeContainer(new CoffeeRepositoryPrisma());
  }

  static get postgresInstance(): CoffeeContainer {
    return new CoffeeContainer(new CoffeeRepositoryPg());
  }

  static get memoryInstance(): CoffeeContainer {
    return new CoffeeContainer(new CoffeeRepositoryMemory());
  }

  public get createCoffeeUseCase(): CreateCoffeeUseCase {
    return new CreateCoffeeUseCase(this.coffeeRepository);
  }

  public get findCoffeeByIdUseCase(): FindCoffeeByIdUseCase {
    return new FindCoffeeByIdUseCase(this.coffeeRepository);
  }

  public get listCoffeesUseCase(): ListCoffeesUseCase {
    return new ListCoffeesUseCase(this.coffeeRepository);
  }
}