import dotenv from 'dotenv';
import path from 'path';

// Carrega o arquivo .env do projeto de exemplo síncronamente antes de qualquer importação tardia
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Fastify from 'fastify';
import qs from 'qs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Declarações dos módulos que serão importados dinamicamente para respeitar o dotenv
let coffeeRoutes: any;
let CoffeeContainer: any;
let prisma: any;
let pool: any;

// Helper para instanciar a aplicação Fastify com um contêiner específico
function buildApp(container: any) {
  const app = Fastify({
    querystringParser: (str) => qs.parse(str),
  });
  app.register(coffeeRoutes, {
    prefix: '/coffees',
    container,
  });
  return app;
}

// Configuração inicial de dados limpos e previsíveis no banco PostgreSQL físico
async function setupTestDatabase(): Promise<void> {
  // Limpar a tabela fisicamente e reiniciar a identidade de forma segura e em cascata
  await pool.query('TRUNCATE TABLE coffee RESTART IDENTITY CASCADE;');

  // Inserir registros determinísticos para os testes de filtragem e2e
  await prisma.coffee.createMany({
    data: [
      {
        id: 1,
        name: 'Cerrado Mineiro',
        origin: 'Brazil',
        roast: 'MEDIUM',
        flavor: 'Chocolate, Mel, Caramelo',
        price: 35.0,
        available: true,
        tags: ['chocolate', 'doce', 'brasil'],
      },
      {
        id: 2,
        name: 'Sidamo Flor',
        origin: 'Ethiopia',
        roast: 'LIGHT',
        flavor: 'Jasmim, Limão, Frutas Vermelhas',
        price: 60.0,
        available: true,
        tags: ['floral', 'citrico', 'etiopea', 'especial'],
      },
      {
        id: 3,
        name: 'Sumatra Vulcão',
        origin: 'Indonesia',
        roast: 'DARK',
        flavor: 'Cedro, Terra, Tabaco',
        price: 45.0,
        available: false,
        tags: ['intenso', 'encorpado', 'indonesia'],
      },
    ],
  });

  // Atualiza a sequência interna do Postgres de autoincremento para o ID máximo inserido.
  // Evita o erro de chave única duplicada (Unique Constraint Violation) nas inserções dinâmicas seguintes.
  await pool.query("SELECT setval(pg_get_serial_sequence('coffee', 'id'), COALESCE((SELECT MAX(id) FROM coffee), 1));");
}

describe('Coffee E2E Tests (Integration with Real PostgreSQL)', () => {
  beforeAll(async () => {
    // Importações dinâmicas tardias para garantir que as variáveis de ambiente do dotenv já estejam no process.env
    const routesMod = await import('../../src/coffee/coffee.routes.js');
    coffeeRoutes = routesMod.coffeeRoutes;

    const containerMod = await import('../../src/coffee/coffee.container.js');
    CoffeeContainer = containerMod.CoffeeContainer;

    const dbMod = await import('../../src/database.js');
    prisma = dbMod.prisma;
    pool = dbMod.pool;
  });

  beforeEach(async () => {
    // Sobe a massa de testes de forma determinística antes de CADA caso de teste
    // Garante independência, isolamento completo de estado e idempotência absoluta
    await setupTestDatabase();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  });

  // Executa o conjunto completo de testes E2E sobre as duas infraestruturas de dados distintas
  describe('Execução E2E com infraestrutura real', () => {
    it('deve realizar operações e2e no Prisma ORM', async () => {
      const container = CoffeeContainer.prismaInstance;
      const app = buildApp(container);

      // GET /coffees
      const resList = await app.inject({ method: 'GET', url: '/coffees' });
      expect(resList.statusCode).toBe(200);
      const listBody = JSON.parse(resList.body);
      expect(listBody.data).toHaveLength(3);

      // GET /coffees?origin===Brazil
      const resFilter = await app.inject({ method: 'GET', url: '/coffees?origin===Brazil' });
      expect(resFilter.statusCode).toBe(200);
      const filterBody = JSON.parse(resFilter.body);
      expect(filterBody.data).toHaveLength(1);
      expect(filterBody.data[0].name).toBe('Cerrado Mineiro');

      // GET /coffees/:id
      const resFind = await app.inject({ method: 'GET', url: '/coffees/2' });
      expect(resFind.statusCode).toBe(200);
      const findBody = JSON.parse(resFind.body);
      expect(findBody.data.name).toBe('Sidamo Flor');

      // POST /coffees
      const payload = {
        name: 'Kopi Luwak',
        origin: 'Indonesia',
        roast: 'MEDIUM',
        flavor: 'Complex and unique coffee',
        price: 180.0,
        available: true,
        tags: ['rare', 'exotic'],
      };
      const resPost = await app.inject({ method: 'POST', url: '/coffees', payload });
      expect(resPost.statusCode).toBe(201);
      const postBody = JSON.parse(resPost.body);
      expect(postBody.data.id).toBeDefined();
      expect(postBody.data.name).toBe('Kopi Luwak');
    });

    it('deve realizar operações e2e no PostgreSQL Nativo (node-pg)', async () => {
      const container = CoffeeContainer.postgresInstance;
      const app = buildApp(container);

      // GET /coffees
      const resList = await app.inject({ method: 'GET', url: '/coffees' });
      expect(resList.statusCode).toBe(200);
      const listBody = JSON.parse(resList.body);
      // Com o isolamento via beforeEach, a base é limpa, contendo exatamente os 3 itens de semente
      expect(listBody.data).toHaveLength(3);

      // GET /coffees?origin===Brazil&price=lte=35.0
      const resFilter = await app.inject({ method: 'GET', url: '/coffees?origin===Brazil&price=lte=35.0' });
      expect(resFilter.statusCode).toBe(200);
      const filterBody = JSON.parse(resFilter.body);
      expect(filterBody.data).toHaveLength(1);
      expect(filterBody.data[0].name).toBe('Cerrado Mineiro');

      // GET /coffees/:id
      const resFind = await app.inject({ method: 'GET', url: '/coffees/2' });
      expect(resFind.statusCode).toBe(200);
      const findBody = JSON.parse(resFind.body);
      expect(findBody.data.name).toBe('Sidamo Flor');

      // POST /coffees
      const payload = {
        name: 'Irish Coffee',
        origin: 'Ireland',
        roast: 'LIGHT',
        flavor: 'Coffee with whiskey and cream',
        price: 15.0,
        available: true,
        tags: ['whiskey', 'cream'],
      };
      const resPost = await app.inject({ method: 'POST', url: '/coffees', payload });
      expect(resPost.statusCode).toBe(201);
      const postBody = JSON.parse(resPost.body);
      expect(postBody.data.id).toBeDefined();
      expect(postBody.data.name).toBe('Irish Coffee');
    });

    it('deve validar erros de validação Zod e retornar 422', async () => {
      const container = CoffeeContainer.prismaInstance;
      const app = buildApp(container);

      const payload = {
        name: '', // Nome vazio
        origin: 'Colombia',
        roast: 'MEDIUM',
        price: -5.0, // Preço inválido
        available: true,
        tags: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/coffees',
        payload,
      });

      expect(response.statusCode).toBe(422);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
      expect(body.details).toBeDefined();
    });

    it('deve aplicar filtros avançados de overlap de arrays e RSQL', async () => {
      const container = CoffeeContainer.postgresInstance;
      const app = buildApp(container);

      // Filtra por tags contendo 'brasil' ou 'floral'
      const response = await app.inject({
        method: 'GET',
        url: '/coffees?tags=&&brasil,floral',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      const names = body.data.map((c: any) => c.name);
      expect(names).toContain('Cerrado Mineiro');
      expect(names).toContain('Sidamo Flor');
    });
  });
});
