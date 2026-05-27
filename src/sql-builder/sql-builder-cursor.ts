import { CursorPage } from '../common';
import { QueryableFields } from '../types';
import { SqlBuilder } from './sql-builder';

export interface CursorParams {
  primaryKeyName: string;
  cursorPage?: CursorPage;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface CursorBuilderResult {
  effectiveOrderBy: Record<string, 'asc' | 'desc'>;
  isSortChanged: boolean;
}

// Mixin method para adicionar no SqlBuilder
// Preferível a herança — chame no final do construtor ou adicione ao prototype
export function applyCursor<T>(builder: SqlBuilder<T>, params: CursorParams): CursorBuilderResult {
  const { cursorPage, primaryKeyName } = params;
  const payload = cursorPage?.decode();

  // orderBy base com tiebreaker garantido
  const baseOrderBy: Record<string, 'asc' | 'desc'> = {
    ...(params.orderBy ?? { [primaryKeyName]: 'asc' }),
  };
  if (!(primaryKeyName in baseOrderBy)) {
    baseOrderBy[primaryKeyName] = 'asc';
  }

  // detecta mudança de sort
  const isSortChanged =
    payload?.orderBy !== undefined &&
    JSON.stringify(payload.orderBy) !== JSON.stringify(baseOrderBy);

  const anchorId =
    !isSortChanged && payload?.values?.[primaryKeyName]
      ? (payload.values[primaryKeyName] as string | number)
      : undefined;

  const isBackward = payload?.direction === 'prev';

  // inverte para paginar para trás
  const effectiveOrderBy: Record<string, 'asc' | 'desc'> = isBackward
    ? Object.fromEntries(
        Object.entries(baseOrderBy).map(([k, v]) => [k, v === 'asc' ? 'desc' : 'asc'])
      )
    : baseOrderBy;

  // aplica WHERE no builder
  if (anchorId !== undefined) {
    const op = isBackward
      ? baseOrderBy[primaryKeyName] === 'asc'
        ? 'lt'
        : 'gt'
      : baseOrderBy[primaryKeyName] === 'asc'
        ? 'gt'
        : 'lt';

    if (op === 'gt') {
      builder.whereGreaterThan(primaryKeyName as unknown as QueryableFields<T>, anchorId as number);
    } else {
      builder.whereLessThan(primaryKeyName as unknown as QueryableFields<T>, anchorId as number);
    }
  }

  // ORDER BY
  for (const [field, dir] of Object.entries(effectiveOrderBy)) {
    builder.addOrder(dir, field as unknown as QueryableFields<T>);
  }

  // LIMIT N+1 para detectar hasNext/hasPrev
  if (cursorPage) {
    builder.addLimit(cursorPage.limit + 1);
  }

  return { effectiveOrderBy, isSortChanged };
}
