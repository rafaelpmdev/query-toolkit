import { describe, expect, it } from 'vitest';
import { CursorCodec } from '../common/pagination/cursor-codec';
import { CursorPage } from '../common/pagination/cursor-page';
import { SqlBuilder } from './sql-builder';
import { applyCursor } from './sql-builder-cursor';

interface TestTable {
  id: number;
  name: string;
  created_at: Date;
}

describe('sql-builder-cursor (applyCursor)', () => {
  it('should apply default order by and limit when cursorPage is provided without cursor', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const cursorPage = new CursorPage(15); // limit = 15, cursor = undefined

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
    });

    expect(result.effectiveOrderBy).toEqual({ id: 'asc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users ORDER BY id asc LIMIT 16');
    expect(built.params).toEqual([]); // limit + 1 = 16 (não é um parâmetro parametrizado no builder)
  });

  it('should apply specific order by when passed in params', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const cursorPage = new CursorPage(10);

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
      orderBy: { name: 'desc' },
    });

    expect(result.effectiveOrderBy).toEqual({ name: 'desc', id: 'asc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users ORDER BY name desc, id asc LIMIT 11');
  });

  it('should filter next page correctly using anchor ID from cursor payload', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const codec = CursorCodec.encode({
      values: { id: 42 },
      direction: 'next',
      orderBy: { id: 'asc' },
    });
    const cursorPage = new CursorPage(10, codec);

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
    });

    expect(result.effectiveOrderBy).toEqual({ id: 'asc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users WHERE (id > $1) ORDER BY id asc LIMIT 11');
    expect(built.params).toEqual([42]);
  });

  it('should filter next page with descending order correctly', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const codec = CursorCodec.encode({
      values: { id: 42 },
      direction: 'next',
      orderBy: { id: 'desc' },
    });
    const cursorPage = new CursorPage(10, codec);

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
      orderBy: { id: 'desc' },
    });

    expect(result.effectiveOrderBy).toEqual({ id: 'desc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users WHERE (id < $1) ORDER BY id desc LIMIT 11');
    expect(built.params).toEqual([42]);
  });

  it('should invert sorting and compare operators when paginating backward (direction prev)', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const codec = CursorCodec.encode({
      values: { id: 42 },
      direction: 'prev',
      orderBy: { id: 'asc' },
    });
    const cursorPage = new CursorPage(10, codec);

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
    });

    // Como direction é prev, o effectiveOrderBy é invertido de ASC para DESC
    expect(result.effectiveOrderBy).toEqual({ id: 'desc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    // E a comparação do anchor ID também é invertida para lt (<)
    expect(built.sql).toBe('SELECT * FROM users WHERE (id < $1) ORDER BY id desc LIMIT 11');
    expect(built.params).toEqual([42]);
  });

  it('should invert sorting and operators backward when primaryKey sorting is desc', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const codec = CursorCodec.encode({
      values: { id: 42 },
      direction: 'prev',
      orderBy: { id: 'desc' },
    });
    const cursorPage = new CursorPage(10, codec);

    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
      orderBy: { id: 'desc' },
    });

    expect(result.effectiveOrderBy).toEqual({ id: 'asc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users WHERE (id > $1) ORDER BY id asc LIMIT 11');
    expect(built.params).toEqual([42]);
  });

  it('should detect sort change and discard anchor id if orderby in cursor does not match baseOrderBy', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const codec = CursorCodec.encode({
      values: { id: 42 },
      direction: 'next',
      orderBy: { name: 'asc', id: 'asc' },
    });
    const cursorPage = new CursorPage(10, codec);

    // Mudar base orderBy para ter apenas { id: 'asc' }
    const result = applyCursor(builder, {
      primaryKeyName: 'id',
      cursorPage,
      orderBy: { id: 'asc' },
    });

    expect(result.isSortChanged).toBe(true);

    const built = builder.build();
    // Como a ordenação mudou, o anchorId é descartado (para evitar dados corrompidos) e não adiciona WHERE
    expect(built.sql).toBe('SELECT * FROM users ORDER BY id asc LIMIT 11');
    expect(built.params).toEqual([]);
  });

  it('should work without cursorPage parameter', () => {
    const builder = new SqlBuilder<TestTable>('SELECT * FROM users');
    const result = applyCursor(builder, {
      primaryKeyName: 'id',
    });

    expect(result.effectiveOrderBy).toEqual({ id: 'asc' });
    expect(result.isSortChanged).toBe(false);

    const built = builder.build();
    expect(built.sql).toBe('SELECT * FROM users ORDER BY id asc');
    expect(built.params).toEqual([]);
  });
});
