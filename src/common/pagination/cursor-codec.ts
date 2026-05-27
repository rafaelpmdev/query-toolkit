export interface CursorPayload {
  values: Record<string, unknown>;
  direction: 'next' | 'prev';
  orderBy: Record<string, 'asc' | 'desc'>;
}

export class CursorCodec {
  static encode(payload: CursorPayload): string {
    const compressed = {
      v: payload.values,
      d: payload.direction === 'next' ? 1 : 0,
      o: Object.fromEntries(
        Object.entries(payload.orderBy || {}).map(([k, v]) => [k, v === 'asc' ? 1 : 0])
      ),
    };
    const json = JSON.stringify(compressed);
    return Buffer.from(json, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static decode(cursor: string): CursorPayload | null {
    try {
      const base64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      const compressed = JSON.parse(json);

      if (!compressed || typeof compressed !== 'object' || !compressed.v) {
        return null;
      }

      return {
        values: compressed.v,
        direction: compressed.d === 1 ? 'next' : 'prev',
        orderBy: Object.fromEntries(
          Object.entries(compressed.o || {}).map(([k, v]) => [k, v === 1 ? 'asc' : 'desc'])
        ),
      };
    } catch {
      return null;
    }
  }
}
