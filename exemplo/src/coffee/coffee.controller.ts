import { QueryParamsParse } from '@raicamposs/query-toolkit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CoffeeContainer } from './coffee.container';
import { createCoffeeSchema } from './dto/create-coffee-data';
import { NotFoundError } from './repositories/coffee.repository';


/**
 * Schema de validação para os query params da listagem.
 */
const systemQuerySchema = z.object({
  sort: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).passthrough();


/**
 * Controller Layer: CoffeeController
 *
 * Responsabilidade Única (SRP): Lidar estritamente com o protocolo HTTP,
 * validação de entrada, parsing de queries (RSQL/Converters) e resposta HTTP.
 */
export class CoffeeController {

  constructor(private container: CoffeeContainer) {
  }


  /**
   * GET /coffees
   * Listagem de cafés com SQL Builder e RSQL lidos diretamente dos parâmetros de query
   */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const query = request.query as Record<string, string>;
      const clauses = new QueryParamsParse(query).build();
      const systemQuery = systemQuerySchema.parse(request.query);

      const result = await this.container.listCoffeesUseCase.execute({
        ...clauses,
        sort: systemQuery.sort,
        limit: systemQuery.limit,
        offset: systemQuery.offset,
      });

      return reply.status(200).send({
        data: result.data,
        meta: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * GET /coffees/:id
   * Busca café por identificador único
   */
  async findById(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const { id } = request.params as { id: string };
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId) || parsedId <= 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'O parâmetro :id deve ser um número inteiro positivo',
        });
      }

      const coffee = await this.container.findCoffeeByIdUseCase.execute(parsedId);
      return reply.status(200).send({ data: coffee });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * POST /coffees
   * Criação de um novo café
   */
  async create(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      const body = createCoffeeSchema.parse(request.body);
      const coffee = await this.container.createCoffeeUseCase.execute(body);
      return reply.status(201).send({ data: coffee });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * Centralização de Tratamento de Erros HTTP
   */
  private handleError(error: unknown, reply: FastifyReply): FastifyReply {
    if (error instanceof NotFoundError) {
      return reply.status(404).send({
        error: 'Not Found',
        message: error.message,
      });
    }

    if (error instanceof RangeError) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message,
      });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({
        error: 'Validation Error',
        message: 'Os dados fornecidos são inválidos',
        details: error.issues,
      });
    }

    // eslint-disable-next-line no-console
    console.error('[CoffeeController] Erro inesperado:', error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
    });
  }
}

