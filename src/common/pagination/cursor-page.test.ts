import { describe, expect, it } from 'vitest';
import type { CursorPayload } from './cursor-codec';
import { CursorCodec } from './cursor-codec';
import { CursorPage } from './cursor-page';

type Row = { id: number; name: string };

describe('CursorPage', () => {
  const samplePayload: CursorPayload = {
    values: { id: 10 },
    direction: 'next',
    orderBy: { id: 'asc' },
  };

  describe('Constructor and Properties', () => {
    it('should initialize with default limit when no limit is provided', () => {
      const page = new CursorPage();
      expect(page.limit).toBe(10);
      expect(page.cursor).toBeUndefined();
    });

    it('should initialize with custom limit and cursor', () => {
      const cursorStr = CursorCodec.encode(samplePayload);
      const page = new CursorPage(25, cursorStr);

      expect(page.limit).toBe(25);
      expect(page.cursor).toBe(cursorStr);
    });
  });

  describe('decode', () => {
    it('should return null when no cursor is provided', () => {
      const page = new CursorPage();
      expect(page.decode()).toBeNull();
    });

    it('should decode a valid cursor', () => {
      const cursorStr = CursorCodec.encode(samplePayload);
      const page = new CursorPage(10, cursorStr);

      expect(page.decode()).toEqual(samplePayload);
    });
  });

  describe('encodeNext', () => {
    it('should encode a cursor with next direction', () => {
      const lastRow = { id: 15, createdAt: '2026-05-22' };
      const orderBy = { id: 'asc' as const };

      const cursorStr = CursorPage.encodeNext(lastRow, orderBy);
      const decoded = CursorCodec.decode(cursorStr);

      expect(decoded).toEqual({
        values: lastRow,
        direction: 'next',
        orderBy,
      });
    });
  });

  describe('encodePrev', () => {
    it('should encode a cursor with prev direction', () => {
      const firstRow = { id: 5, createdAt: '2026-05-22' };
      const orderBy = { id: 'asc' as const };

      const cursorStr = CursorPage.encodePrev(firstRow, orderBy);
      const decoded = CursorCodec.decode(cursorStr);

      expect(decoded).toEqual({
        values: firstRow,
        direction: 'prev',
        orderBy,
      });
    });
  });

  describe('direction: next', () => {
    it('should set hasMore when query returns N+1 rows', () => {
      const rows: Row[] = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ];

      const result = CursorPage.processResult(rows, 2, 'next', samplePayload.orderBy);

      expect(result.data).toHaveLength(2);
      expect(result.hasNext).toBe(true);
    });

    it('should not set hasMore when query returns exactly limit rows', () => {
      const rows: Row[] = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];

      const result = CursorPage.processResult(rows, 2, 'next', samplePayload.orderBy);

      expect(result.data).toHaveLength(2);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('direction: prev', () => {
    it('should set hasPrev when query returns N+1 rows', () => {
      const rows: Row[] = [
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
        { id: 1, name: 'a' },
      ];

      const result = CursorPage.processResult(rows, 2, 'prev', samplePayload.orderBy);

      expect(result.data).toHaveLength(2);
      expect(result.hasPrev).toBe(true);
    });

    it('should not set hasPrev when query returns exactly limit rows', () => {
      const rows: Row[] = [
        { id: 2, name: 'b' },
        { id: 1, name: 'a' },
      ];

      const result = CursorPage.processResult(rows, 2, 'prev', samplePayload.orderBy);

      expect(result.data).toHaveLength(2);
      expect(result.hasPrev).toBe(false);
    });

    it('should reverse row order for the consumer', () => {
      const rows: Row[] = [
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
        { id: 1, name: 'a' },
      ];

      const result = CursorPage.processResult(rows, 2, 'prev', samplePayload.orderBy);

      expect(result.data).toEqual([
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ]);
    });

    it('should always set hasNext true when direction is prev', () => {
      const rows: Row[] = [{ id: 1, name: 'a' }];
      const result = CursorPage.processResult(rows, 2, 'prev', samplePayload.orderBy);
      expect(result.hasNext).toBe(true);
    });
  });

  describe('cursor generation in processResult', () => {
    it('should generate nextCursor when hasNext is true (direction next with extra row)', () => {
      const rows: Row[] = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ];
      const result = CursorPage.processResult(rows, 2, 'next', { id: 'asc' });

      expect(result.nextCursor).toBeDefined();
      expect(result.prevCursor).toBeUndefined();

      if (result.nextCursor) {
        const decoded = CursorCodec.decode(result.nextCursor);
        expect(decoded?.direction).toBe('next');
        expect(decoded?.values.id).toBe(2);
      }
    });

    it('should generate prevCursor when hasPrev is true (hasCurrentCursor=true, direction next)', () => {
      const rows: Row[] = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const result = CursorPage.processResult(rows, 2, 'next', { id: 'asc' }, true);

      expect(result.hasPrev).toBe(true);
      expect(result.prevCursor).toBeDefined();

      if (result.prevCursor) {
        const decoded = CursorCodec.decode(result.prevCursor);
        expect(decoded?.direction).toBe('prev');
        expect(decoded?.values.id).toBe(1);
      }
    });

    it('should not generate cursors when data is empty', () => {
      const result = CursorPage.processResult([], 10, 'next', { id: 'asc' });

      expect(result.data).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
      expect(result.prevCursor).toBeUndefined();
    });

    it('should inject primaryKey into orderBy if not present', () => {
      const rows: Row[] = [
        { id: 1, name: 'alpha' },
        { id: 2, name: 'beta' },
        { id: 3, name: 'gamma' },
      ];
      const result = CursorPage.processResult(rows, 2, 'next', { name: 'asc' }, false, 'id');

      expect(result.nextCursor).toBeDefined();
      if (result.nextCursor) {
        const decoded = CursorCodec.decode(result.nextCursor);
        expect(decoded?.orderBy).toHaveProperty('id');
        expect(decoded?.orderBy).toHaveProperty('name');
      }
    });
  });

  describe('resolveOrderBy', () => {
    it('should return undefined when orderBy is undefined', () => {
      expect(CursorPage.resolveOrderBy(undefined, 'next')).toBeUndefined();
      expect(CursorPage.resolveOrderBy(undefined, 'prev')).toBeUndefined();
    });

    it('should return orderBy unchanged when direction is next', () => {
      const orderBy: Array<Record<string, 'asc' | 'desc'>> = [{ id: 'asc' }, { name: 'desc' }];
      const result = CursorPage.resolveOrderBy(orderBy, 'next');
      expect(result).toEqual(orderBy);
    });

    it('should invert asc to desc when direction is prev', () => {
      const result = CursorPage.resolveOrderBy([{ id: 'asc' as const }], 'prev');
      expect(result).toEqual([{ id: 'desc' }]);
    });

    it('should invert desc to asc when direction is prev', () => {
      const result = CursorPage.resolveOrderBy([{ createdAt: 'desc' as const }], 'prev');
      expect(result).toEqual([{ createdAt: 'asc' }]);
    });

    it('should invert all fields in each entry when direction is prev', () => {
      const orderBy = [{ name: 'asc' as const, age: 'desc' as const }];
      const result = CursorPage.resolveOrderBy(orderBy, 'prev');
      expect(result).toEqual([{ name: 'desc', age: 'asc' }]);
    });

    it('should invert each entry independently when direction is prev', () => {
      const orderBy: Array<Record<string, 'asc' | 'desc'>> = [{ id: 'asc' }, { createdAt: 'desc' }];
      const result = CursorPage.resolveOrderBy(orderBy, 'prev');
      expect(result).toEqual([{ id: 'desc' }, { createdAt: 'asc' }]);
    });

    it('should not mutate the original orderBy array', () => {
      const orderBy = [{ id: 'asc' as const }];
      CursorPage.resolveOrderBy(orderBy, 'prev');
      expect(orderBy).toEqual([{ id: 'asc' }]);
    });
  });

  describe('Constructor with prevCursor and nextCursor', () => {
    it('should store prevCursor and nextCursor provided in constructor', () => {
      const page = new CursorPage(10, undefined, 'prev-tok', 'next-tok');
      expect(page.prevCursor).toBe('prev-tok');
      expect(page.nextCursor).toBe('next-tok');
    });
  });

  describe('toJSON', () => {
    it('should serialize all cursor page fields to a plain object', () => {
      const cursor = CursorCodec.encode(samplePayload);
      const page = new CursorPage(20, cursor, 'prev-tok', 'next-tok');

      expect(page.toJSON()).toEqual({
        limit: 20,
        cursor,
        prevCursor: 'prev-tok',
        nextCursor: 'next-tok',
      });
    });

    it('should serialize correctly when cursor tokens are undefined', () => {
      const page = new CursorPage(15);

      expect(page.toJSON()).toEqual({
        limit: 15,
        cursor: undefined,
        prevCursor: undefined,
        nextCursor: undefined,
      });
    });
  });
});
