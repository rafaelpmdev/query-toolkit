import { describe, it, expect } from 'vitest';
import { CursorCodec, CursorPayload } from './cursor-codec';

describe('CursorCodec', () => {
  const payload: CursorPayload = {
    values: { id: 42, name: 'Espresso' },
    direction: 'next',
    orderBy: { id: 'asc', name: 'desc' },
  };

  describe('encode', () => {
    it('should encode a CursorPayload into a valid URL-safe base64 string', () => {
      const cursor = CursorCodec.encode(payload);

      expect(cursor).toBeTypeOf('string');
      // Não deve conter caracteres não URL-safe como +, / ou =
      expect(cursor).not.toContain('+');
      expect(cursor).not.toContain('/');
      expect(cursor).not.toContain('=');
    });
  });

  describe('decode', () => {
    it('should decode a valid cursor string back into the original CursorPayload', () => {
      const cursor = CursorCodec.encode(payload);
      const decoded = CursorCodec.decode(cursor);

      expect(decoded).toEqual(payload);
    });

    it('should return null when decoding an invalid or malformed cursor string', () => {
      const decoded = CursorCodec.decode('invalid-base-64-string!!!@@@');
      expect(decoded).toBeNull();
    });

    it('should return null when decoding a cursor with non-JSON content', () => {
      const invalidJsonBase64 = Buffer.from('hello world', 'utf-8').toString('base64');
      const decoded = CursorCodec.decode(invalidJsonBase64);
      expect(decoded).toBeNull();
    });

    it('should return null when decoding a cursor with valid JSON but missing v field', () => {
      const missingV = Buffer.from(JSON.stringify({ d: 1, o: {} }), 'utf-8').toString('base64');
      const decoded = CursorCodec.decode(missingV);
      expect(decoded).toBeNull();
    });

    it('should return null when decoding an empty JSON object', () => {
      const emptyObj = Buffer.from(JSON.stringify({}), 'utf-8').toString('base64');
      const decoded = CursorCodec.decode(emptyObj);
      expect(decoded).toBeNull();
    });

    it('should decode direction prev when d is 0', () => {
      const prevPayload: CursorPayload = {
        values: { id: 5 },
        direction: 'prev',
        orderBy: { id: 'asc' },
      };
      const cursor = CursorCodec.encode(prevPayload);
      const decoded = CursorCodec.decode(cursor);
      expect(decoded?.direction).toBe('prev');
    });

    it('should decode orderBy desc when o value is 0', () => {
      const descPayload: CursorPayload = {
        values: { id: 10 },
        direction: 'next',
        orderBy: { id: 'desc' },
      };
      const cursor = CursorCodec.encode(descPayload);
      const decoded = CursorCodec.decode(cursor);
      expect(decoded?.orderBy).toEqual({ id: 'desc' });
    });

    it('should handle cursor without o field by returning empty orderBy', () => {
      const noO = Buffer.from(JSON.stringify({ v: { id: 1 }, d: 1 }), 'utf-8').toString('base64');
      const decoded = CursorCodec.decode(noO);
      expect(decoded).not.toBeNull();
      expect(decoded?.orderBy).toEqual({});
    });
  });
});
