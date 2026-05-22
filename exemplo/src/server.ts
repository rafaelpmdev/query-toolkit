import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import qs from 'qs';
import { coffeeRoutes } from './coffee/coffee.routes';
import { diagnosticsRoutes } from './diagnostics/diagnostics.routes';

/**
 * Bootstrap do servidor Fastify.
 * Responsabilidade única: configurar e iniciar o servidor HTTP.
 */
async function buildServer(): Promise<void> {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    querystringParser: (str) => qs.parse(str),
  });

  await app.register(cors, { origin: true });

  // Configuração do Swagger / OpenAPI v3
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: '☕ Query Toolkit Example API',
        description: 'Demonstração oficial da biblioteca @raicamposs/query-toolkit com PostgreSQL e Fastify.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Coffees', description: 'Operações e buscas filtradas por RSQL/Array no recurso de Cafés' },
        { name: 'Diagnostics', description: 'Utilitários e endpoints técnicos para diagnóstico do Query Toolkit' }
      ]
    },
  });

  // Interface visual do Swagger exposta em /docs
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  app.register(coffeeRoutes, { prefix: '/coffees' });
  app.register(diagnosticsRoutes, { prefix: '/decode' });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const port = Number(process.env['PORT'] ?? 3000);
  const host = process.env['HOST'] ?? '0.0.0.0';

  try {
    const address = await app.listen({ port, host });
    app.log.info(`🚀 Servidor iniciado em ${address}`);
    app.log.info('📚 Showcase da biblioteca @raicamposs/query-toolkit');
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

buildServer();
