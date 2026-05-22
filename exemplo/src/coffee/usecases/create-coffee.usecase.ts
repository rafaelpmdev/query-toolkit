
import { CreateCoffeeData } from '../dto/create-coffee-data';
import { Coffee } from '../entities/coffee';
import { ICoffeeRepository } from '../repositories/coffee.repository';


/**
 * Caso de Uso: Criar Café
 * Responsabilidade Única (SRP): Executar a lógica de persistência e criação de novos cafés.
 */
export class CreateCoffeeUseCase {

  constructor(
    private readonly coffeeRepository: ICoffeeRepository
  ) { }

  async execute(data: CreateCoffeeData): Promise<Coffee> {
    return this.coffeeRepository.create(data);
  }
}

