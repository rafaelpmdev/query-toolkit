import Fastify from 'fastify';
import qs from 'qs';
import { describe, expect, it } from 'vitest';
import { diagnosticsRoutes } from './diagnostics.routes';

function buildApp() {
  const app = Fastify({
    querystringParser: (str) => qs.parse(str),
  });
  app.register(diagnosticsRoutes, { prefix: '/decode' });
  return app;
}

describe('Diagnostics Routes Integration Tests (GET /decode)', () => {
  it('should successfully decode complex RSQL queries and return the operators array map', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/decode?origin===Brazil&price=btw=20,60',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
    
    expect(body.origin).toBeDefined();
    expect(body.origin[0]).toHaveProperty('symbol', '==');
    expect(body.origin[0]).toHaveProperty('params', '==Brazil');

    expect(body.price).toBeDefined();
    expect(body.price[0]).toHaveProperty('symbol', 'btw=');
    expect(body.price[0]).toHaveProperty('params', 'btw=20,60');
  });

  it('should successfully decode flat parameters without explicit RSQL operators using equals', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/decode?origin=Brazil',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
    expect(body.origin).toBeDefined();
    expect(body.origin[0]).toHaveProperty('symbol', '');
    expect(body.origin[0]).toHaveProperty('params', 'Brazil');
  });

  it('should successfully decode parameters using asRsqlOperatorsObject under /rsql endpoint', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/decode/rsql?origin===Brazil&price=btw=20,60',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toBeDefined();
    expect(body.origin).toEqual({ equals: 'Brazil' });
    expect(body.price).toEqual({ gte: 20, lte: 60 });
  });
});
