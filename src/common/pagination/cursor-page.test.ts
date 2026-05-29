import { describe, expect, it } from 'vitest';
import { CursorCodec, CursorPayload } from './cursor-codec';
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
  });
});
