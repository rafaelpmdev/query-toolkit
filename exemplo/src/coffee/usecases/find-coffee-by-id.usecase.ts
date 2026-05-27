
import type { Coffee } from "../entities/coffee";
import { ICoffeeRepository, NotFoundError } from '../repositories/coffee.repository';

/**
 * Caso de Uso: Buscar Café por ID
 * Responsabilidade Única (SRP): Localizar um registro de café pelo seu identificador único.
 */
export class FindCoffeeByIdUseCase {
  constructor(
    private readonly coffeeRepository: ICoffeeRepository
  ) { }
  async execute(id: number): Promise<Coffee> {
    const coffee = await this.coffeeRepository.findById(id);
    if (!coffee) {
      throw new NotFoundError('Coffee not found');
    }
    return coffee;
  }
}
