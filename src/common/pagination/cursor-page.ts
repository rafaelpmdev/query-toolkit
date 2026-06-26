import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from './classic-page';
import type { CursorPayload } from './cursor-codec';
import { CursorCodec } from './cursor-codec';

export class CursorPage {
  private readonly _limit: number;
  readonly cursor?: string;
  readonly prevCursor?: string;
  readonly nextCursor?: string;

  constructor(
    limit = DEFAULT_PAGE_LIMIT,
    cursor?: string,
    prevCursor?: string,
    nextCursor?: string
  ) {
    const parsedLimit = limit !== undefined && limit > 0 ? limit : DEFAULT_PAGE_LIMIT;
    this._limit = Math.min(parsedLimit, MAX_PAGE_LIMIT);
    this.cursor = cursor;
    this.prevCursor = prevCursor;
    this.nextCursor = nextCursor;
  }

  get limit(): number {
    return this._limit;
  }

  decode(): CursorPayload | null {
    if (!this.cursor) return null;
    return CursorCodec.decode(this.cursor);
  }

  static resolveOrderBy(
    orderBy: Array<Record<string, 'asc' | 'desc'>> | undefined,
    direction: 'next' | 'prev'
  ): Array<Record<string, 'asc' | 'desc'>> | undefined {
    if (!orderBy || direction === 'next') return orderBy;
    return orderBy.map(
      (entry) =>
        Object.fromEntries(
          Object.entries(entry).map(([k, v]) => [k, v === 'asc' ? 'desc' : 'asc'])
        ) as Record<string, 'asc' | 'desc'>
    );
  }

  static encodeNext(
    lastRow: Record<string, unknown>,
    orderBy: Record<string, 'asc' | 'desc'>
  ): string {
    return CursorCodec.encode({ values: lastRow, direction: 'next', orderBy });
  }

  static encodePrev(
    firstRow: Record<string, unknown>,
    orderBy: Record<string, 'asc' | 'desc'>
  ): string {
    return CursorCodec.encode({ values: firstRow, direction: 'prev', orderBy });
  }

  static processResult<T>(
    rawData: T[],
    limit: number,
    direction: 'next' | 'prev',
    orderBy: Record<string, 'asc' | 'desc'>,
    hasCurrentCursor: boolean = false,
    primaryKey: string = 'id'
  ): { data: T[]; hasNext: boolean; hasPrev: boolean; nextCursor?: string; prevCursor?: string } {
    let hasMore = false;
    const rows = [...rawData];

    if (direction === 'next') {
      if (rows.length > limit) {
        hasMore = true;
        rows.pop(); // Remove o item extra N+1
      }
    } else {
      rows.reverse(); // Desinverte a ordem para o usuário
      if (rows.length > limit) {
        hasMore = true;
        rows.shift(); // Remove o item extra N+1 que ficou no início
      }
    }

    const hasNext = direction === 'next' ? hasMore : true;
    const hasPrev = direction === 'prev' ? hasMore : hasCurrentCursor;

    let nextCursor: string | undefined = undefined;
    let prevCursor: string | undefined = undefined;

    if (rows.length > 0) {
      const baseOrderBy = { ...orderBy };
      if (!(primaryKey in baseOrderBy)) {
        baseOrderBy[primaryKey] = 'asc';
      }

      if (hasNext) {
        const lastRow = rows[rows.length - 1] as Record<string, unknown>;
        const nextValues: Record<string, unknown> = {};
        for (const key of Object.keys(baseOrderBy)) {
          nextValues[key] = lastRow[key];
        }

        nextCursor = CursorPage.encodeNext(nextValues, baseOrderBy);
      }

      if (hasPrev) {
        const firstRow = rows[0] as Record<string, unknown>;
        const prevValues: Record<string, unknown> = {};
        for (const key of Object.keys(baseOrderBy)) {
          prevValues[key] = firstRow[key];
        }

        prevCursor = CursorPage.encodePrev(prevValues, baseOrderBy);
      }
    }

    return { data: rows, hasNext, hasPrev, nextCursor, prevCursor };
  }

  toJSON() {
    return {
      limit: this._limit,
      cursor: this.cursor,
      prevCursor: this.prevCursor,
      nextCursor: this.nextCursor,
    };
  }
}
