import { FastifyInstance } from 'fastify';
import { CoffeeContainer } from './coffee.container';
import { CoffeeController } from './coffee.controller';




/**
 * Módulo de Rotas do Recurso: Coffee
*
* Responsabilidade Única (SRP): Apenas fiação das rotas HTTP do Fastify.
* Todo o comportamento lógico de controle, validação e parsing é delegado ao CoffeeController.
*/
interface CoffeeRoutesOptions {
  container?: CoffeeContainer;
}

export async function coffeeRoutes(app: FastifyInstance, opts: CoffeeRoutesOptions = {}): Promise<void> {
  const container = opts.container || CoffeeContainer.postgresInstance;
  const coffeeController = new CoffeeController(container);

  /**
   * GET /coffees
   * Listagem flexível usando SqlBuilder e suporte a filtros RSQL via query string.
   */
  app.get('/', {
    schema: {
      description: 'Lista cafés dinamicamente com suporte a filtros parametrizados e RSQL',
      tags: ['Coffees'],
    },
  }, (request, reply) => coffeeController.list(request, reply));

  /**
   * GET /coffees/:id
   * Recuperação de um café por ID.
   */
  app.get('/:id', {
    schema: {
      description: 'Recupera detalhes de um café por ID',
      tags: ['Coffees'],
    },
  }, (request, reply) => coffeeController.findById(request, reply));

  /**
   * POST /coffees
   * Cadastro de novos cafés com validação estrita.
   */
  app.post('/', {
    schema: {
      description: 'Cadastra um novo café no banco de dados',
      tags: ['Coffees'],
    },
  }, (request, reply) => coffeeController.create(request, reply));
}
