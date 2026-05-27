import { describe, it, expect } from 'vitest';
import { CursorPage } from './cursor-page';
import { CursorCodec, CursorPayload } from './cursor-codec';

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
});
