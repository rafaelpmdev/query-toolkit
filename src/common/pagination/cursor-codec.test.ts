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
      // Codifica "hello world" simples em base64, que não é um JSON válido
      const invalidJsonBase64 = Buffer.from('hello world', 'utf-8').toString('base64');
      const decoded = CursorCodec.decode(invalidJsonBase64);
      expect(decoded).toBeNull();
    });
  });
});
