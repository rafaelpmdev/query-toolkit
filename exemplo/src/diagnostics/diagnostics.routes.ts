import { QueryParamsParse } from '@raicamposs/query-toolkit';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Coffee } from '../coffee/entities/coffee';

/**
 * Utilitário global para lidar com tratamento genérico de erros HTTP nas rotas.
 */
function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof Error) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: error.message,
    });
  }
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Ocorreu um erro inesperado no processamento do diagnóstico.',
  });
}

/**
 * Módulo de Rotas dedicadas a Diagnósticos e Utilidades técnicas do Query Toolkit.
 * Responsabilidade Única (SRP): expor endpoints utilitários globais do sistema.
 */
export async function diagnosticsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /decode
   *
   * Rota utilitária de diagnóstico que decodifica parâmetros de consulta (RSQL / estruturados)
   * na árvore de Clause do core da biblioteca, retornando a árvore em JSON.
   */
  app.get('/', {
    schema: {
      description: 'Decodifica parâmetros de consulta (RSQL ou estruturados) e retorna a árvore de Clause gerada.',
      tags: ['Diagnostics'],
      querystring: {
        type: 'object',
        additionalProperties: true,
        description: 'Qualquer parâmetro de filtro dinâmico ou string RSQL (ex: name===Bourbon, price=btw=20,60)'
      },
      response: {
        200: {
          description: 'A estrutura de Clause decodificada com sucesso',
          type: 'object',
          additionalProperties: true
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const queryParams = new QueryParamsParse(query).build();

      return reply.status(200).send(queryParams);
    } catch (error) {
      return handleError(error, reply);
    }
  });

  app.get('/rsql', {
    schema: {
      description: 'Decodifica parâmetros de consulta (RSQL ou estruturados) e retorna a árvore de Clause gerada.',
      tags: ['Diagnostics'],
      querystring: {
        type: 'object',
        additionalProperties: true,
        description: 'Qualquer parâmetro de filtro dinâmico ou string RSQL (ex: name===Bourbon, price=btw=20,60)'
      },
      response: {
        200: {
          description: 'A estrutura de Clause decodificada com sucesso',
          type: 'object',
          additionalProperties: true
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as Record<string, string>;
      const queryParams = new QueryParamsParse<Coffee>(query).asRsqlOperatorsObject();
      return reply.status(200).send(queryParams);
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
