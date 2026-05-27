import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoffeeRepositoryPg } from './coffee-pg.repository';
import { pool } from '../../database';
import { EqualsOperator, CursorPage } from '@raicamposs/query-toolkit';
import { ListCoffeesParams } from './coffee.repository';

// Mock do pool de conexão com o PostgreSQL
vi.mock('../../database', () => {
  return {
    pool: {
      query: vi.fn(),
    },
    prisma: {},
  };
});

describe('CoffeeRepositoryPg (PostgreSQL Native Repository Tests)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list()', () => {
    it('should successfully build pure SQL query and count query from filters and execute via pool', async () => {
      const repository = new CoffeeRepositoryPg();

      // Mock dos retornos do banco de dados (linhas de dados e contagem de total)
      const mockRows = [
        { id: 1, name: 'Espresso', price: 3.5 },
        { id: 2, name: 'Cappuccino', price: 5.0 },
      ];

      // O list realiza duas queries paralelamente com Promise.all
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: mockRows } as any);

      const params: ListCoffeesParams = {
        params: {
          name: [new EqualsOperator('Espresso')],
        },
        pagination: new CursorPage(10),
      };

      const result = await repository.list(params);

      // Asserções no resultado formatado
      expect(result.data).toEqual(mockRows);
      expect(result.pagination.limit).toBe(10);

      // Verifica se a primeira query utilizou o SqlBuilder parametrizado corretamente
      const [firstSqlCall, firstParams] = vi.mocked(pool.query).mock.calls[0];
      expect(firstSqlCall).toContain('SELECT * FROM coffee');
      expect(firstSqlCall).toContain('name = $1');
      expect(firstSqlCall).toContain('LIMIT 11');
      expect(firstParams).toEqual(['Espresso']);
    });
  });

  describe('findById()', () => {
    it('should query coffee by ID using parameterized query', async () => {
      const repository = new CoffeeRepositoryPg();
      const mockCoffee = { id: 1, name: 'Espresso' };

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockCoffee] } as any);

      const result = await repository.findById(1);

      expect(result).toEqual(mockCoffee);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM coffee WHERE id = $1',
        [1]
      );
    });

    it('should return null when coffee does not exist', async () => {
      const repository = new CoffeeRepositoryPg();

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [] } as any);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('should insert a new coffee using parameterized query and return the created record', async () => {
      const repository = new CoffeeRepositoryPg();
      const mockCoffee = { id: 3, name: 'Late', origin: 'France' };

      vi.mocked(pool.query).mockResolvedValueOnce({ rows: [mockCoffee] } as any);

      const payload = {
        name: 'Late',
        origin: 'France',
        roast: 'MEDIUM' as const,
        flavor: 'Smooth milky coffee',
        price: 4.5,
        available: true,
        tags: ['milk', 'light'],
      };

      const result = await repository.create(payload);

      expect(result).toEqual(mockCoffee);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO coffee'),
        [
          payload.name,
          payload.origin,
          payload.roast,
          payload.flavor,
          payload.price,
          payload.available,
          payload.tags,
        ]
      );
    });
  });
});
