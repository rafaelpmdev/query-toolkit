import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoffeeRepositoryPrisma } from './coffee-prisma.repository';
import { prisma } from '../../database';
import { EqualsOperator } from '@raicamposs/query-toolkit';

// Mock do prisma client
vi.mock('../../database', () => {
  return {
    pool: {},
    prisma: {
      coffee: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('CoffeeRepositoryPrisma (Prisma Repository Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list()', () => {
    it('should successfully build Prisma query where conditions and execute via prisma', async () => {
      const repository = new CoffeeRepositoryPrisma();

      const mockData = [
        { id: 1, name: 'Espresso', price: 3.5 },
      ];
      const mockCount = 1;

      vi.mocked(prisma.coffee.findMany).mockResolvedValueOnce(mockData as any);
      vi.mocked(prisma.coffee.count).mockResolvedValueOnce(mockCount);

      const params = {
        limit: 5,
        offset: 0,
        name: [new EqualsOperator('==Espresso')],
      };

      const result = await repository.list(params);

      expect(result.data).toEqual(mockData);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(0);
      expect(result.total).toBe(1);

      expect(prisma.coffee.findMany).toHaveBeenCalledWith({
        where: { name: 'Espresso' },
        take: 5,
        skip: 0,
      });

      expect(prisma.coffee.count).toHaveBeenCalledWith({
        where: { name: 'Espresso' },
      });
    });
  });

  describe('findById()', () => {
    it('should query coffee by unique id', async () => {
      const repository = new CoffeeRepositoryPrisma();
      const mockCoffee = { id: 1, name: 'Espresso' };

      vi.mocked(prisma.coffee.findUnique).mockResolvedValueOnce(mockCoffee as any);

      const result = await repository.findById(1);

      expect(result).toEqual(mockCoffee);
      expect(prisma.coffee.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('create()', () => {
    it('should call prisma create with valid data payload', async () => {
      const repository = new CoffeeRepositoryPrisma();
      const payload = {
        name: 'Irish Coffee',
        origin: 'Ireland',
        roast: 'LIGHT' as const,
        flavor: 'Bold',
        price: 8.5,
        available: true,
        tags: ['whiskey'],
      };

      vi.mocked(prisma.coffee.create).mockResolvedValueOnce({ id: 4, ...payload } as any);

      const result = await repository.create(payload);

      expect(result).toHaveProperty('id', 4);
      expect(prisma.coffee.create).toHaveBeenCalledWith({
        data: payload,
      });
    });
  });
});
