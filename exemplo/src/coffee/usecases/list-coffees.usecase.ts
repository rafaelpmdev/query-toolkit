import type { ICoffeeRepository, ListCoffeesParams, ListCoffeesResult } from '../repositories/coffee.repository';

/**
 * Caso de Uso: Listar Cafés
 * Responsabilidade Única (SRP): Orquestrar a listagem de cafés via repositório injetado.
 */
export class ListCoffeesUseCase {
  constructor(
    private readonly coffeeRepository: ICoffeeRepository
  ) { }
  async execute(params: ListCoffeesParams): Promise<ListCoffeesResult> {
    return this.coffeeRepository.list(params);
  }
}
