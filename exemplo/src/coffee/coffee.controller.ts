import { CursorPage, QueryParamsParse, RsqlQueryParams } from '@raicamposs/query-toolkit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CoffeeContainer } from './coffee.container';
import { createCoffeeSchema } from './dto/create-coffee-data';
import type { Coffee } from './entities/coffee';
import { NotFoundError } from './repositories/coffee.repository';

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
      const clauses = new QueryParamsParse<Coffee>(query as RsqlQueryParams<Coffee>).build();
      const pagination = (clauses.pagination as CursorPage | undefined) ?? new CursorPage(20);

      const result = await this.container.listCoffeesUseCase.execute({
        params: clauses.params,
        sort: clauses.sort,
        pagination: pagination,
      });

      return reply.status(200).send({
        data: result.data,
        meta: result.pagination,
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

