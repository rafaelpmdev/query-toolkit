import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import qs from 'qs';
import { coffeeRoutes } from './coffee.routes';
import { CoffeeContainer } from './coffee.container';

function buildApp() {
  const app = Fastify({
    querystringParser: (str) => qs.parse(str),
  });
  // Registra rotas injetando o container em memória
  app.register(coffeeRoutes, {
    prefix: '/coffees',
    container: CoffeeContainer.memoryInstance,
  });
  return app;
}

describe('Coffee Routes Integration Tests (Fastify + In-Memory Repository)', () => {
  describe('GET /coffees', () => {
    it('should successfully list coffees and return default limit and cursor metadata', async () => {
      const app = buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/coffees',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);

      expect(body.meta.limit).toBe(20);
      // Since it uses Cursor pagination by default now:
      expect(body.meta.cursor).toBeUndefined(); // Assuming items fit in the first page so no next cursor is strictly needed for the same query. Or it could be defined if there are more. Since limit is 20 and total is 6, there's no next page, cursor can be undefined.
      expect(body.meta.offset).toBeUndefined();
    });

    it('should respect custom pagination limits and return valid cursor when more items exist', async () => {
      const app = buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/coffees?limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);

      expect(body.meta.limit).toBe(2);
      expect(typeof body.meta.nextCursor).toBe('string'); // Next cursor should be generated
      expect(body.meta.offset).toBeUndefined();
    });
  });

  describe('GET /coffees/:id', () => {
    it('should successfully return a coffee details by valid ID', async () => {
      const app = buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/coffees/1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe(1);
      expect(body.data.name).toBe('Espresso');
    });

    it('should return 404 when coffee does not exist', async () => {
      const app = buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/coffees/999',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
      expect(body.message).toContain('not found');
    });

    it('should return 400 when ID is not a positive integer', async () => {
      const app = buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/coffees/invalid-id',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('positivo');
    });
  });

  describe('POST /coffees', () => {
    it('should successfully create a new coffee with valid payload', async () => {
      const app = buildApp();

      const payload = {
        name: 'Irish Coffee',
        origin: 'Ireland',
        roast: 'LIGHT',
        flavor: 'Coffee with whiskey and cream',
        price: 8.5,
        available: true,
        tags: ['whiskey', 'cream', 'alcohol'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/coffees',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('Irish Coffee');
    });

    it('should return 422 when payload validation fails', async () => {
      const app = buildApp();

      const payload = {
        name: '', // Empty name triggers Zod error
        origin: 'Ireland',
        roast: 'LIGHT',
        price: -5.0, // Negative price triggers Zod error
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
  });
});
