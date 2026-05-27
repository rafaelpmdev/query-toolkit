import { describe, expect, it } from 'vitest';
import { ClassicPage, CursorPage, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../common';
import { EqualsOperator } from '../query-operator';
import { OperatorRegistry } from './operator-registry';
import { QueryParamsParse } from './query-params-parse';

interface UserTest {
  id: number;
  name: string;
  age: number;
  status: string;
}

describe('QueryParamsParse', () => {
  it('should parse simple query parameters', () => {
    const params = { name: '==John', age: 'gt=18' };
    const parser = new QueryParamsParse<UserTest>(params);
    const { params: result } = parser.build();

    expect(result.name).toHaveLength(1);
    expect(result.name[0]).toBeInstanceOf(EqualsOperator);
    expect(result.age).toHaveLength(1);
    expect(result.age[0].symbol).toBe('gt=');
  });

  it('should handle array parameters', () => {
    const params = { status: ['==active', '==pending'] };
    const parser = new QueryParamsParse<UserTest>(params as any);
    const { params: result } = parser.build();

    expect(result.status).toHaveLength(2);
    expect(result.status[0]).toBeInstanceOf(EqualsOperator);
    expect(result.status[1]).toBeInstanceOf(EqualsOperator);
  });

  it('should ignore empty values or keys', () => {
    const params = { name: '', '': '==value' };
    const parser = new QueryParamsParse<UserTest>(params);
    const { params: result } = parser.build();

    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should parse custom operators registered in OperatorRegistry', () => {
    class CustomFakeOperator extends EqualsOperator {
      constructor(rawValue: string) {
        super(rawValue);
      }
    }

    // Registrar o operador customizado
    OperatorRegistry.register('fake=' as any, (params: string) => {
      const [, value] = params.split('fake=');
      return new CustomFakeOperator(`==${value}`);
    });

    const params = { field: 'fake=value' };
    const parser = new QueryParamsParse<any>(params);
    const { params: result } = parser.build();

    expect(result.field).toHaveLength(1);
    expect(result.field[0]).toBeInstanceOf(CustomFakeOperator);
    expect(result.field[0].value()).toBe('value');
  });

  describe('Shape and Key Filtering', () => {
    it('should only parse keys defined in shape schema', () => {
      const params = { name: '==John', age: 'gt=18', secret: '==forbidden' };
      const shape = { name: true, age: true } as any;
      const parser = new QueryParamsParse<UserTest>(params as any, shape);
      const { params: result } = parser.build();

      expect(result.name).toBeDefined();
      expect(result.age).toBeDefined();
      expect((result as any).secret).toBeUndefined();
    });
  });

  describe('Sort Integration', () => {
    it('should parse sort directions for shape-approved keys', () => {
      const params = { sort: 'name:asc,-age,secret:desc' };
      const shape = { name: true, age: true } as any;
      const parser = new QueryParamsParse<UserTest>(params as any, shape);
      const { sort } = parser.build();

      expect(sort).toBeDefined();
      expect(sort?.name).toBe('asc');
      expect(sort?.age).toBe('desc');
      expect((sort as any).secret).toBeUndefined();
    });
  });

  describe('Pagination Strategies', () => {
    it('should return undefined if no pagination parameters are sent', () => {
      const parser = new QueryParamsParse<any>({});
      const { pagination } = parser.build();
      expect(pagination).toBeUndefined();
    });

    it('should parse CursorPage when limit and cursor are provided', () => {
      const params = { limit: '15', cursor: 'eyJ2Ijp7ImlkIjo0Mn19' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser.build();

      expect(pagination).toBeInstanceOf(CursorPage);
      expect(pagination?.limit).toBe(15);
      expect((pagination as CursorPage).cursor).toBe('eyJ2Ijp7ImlkIjo0Mn19');
    });

    it('should parse ClassicPage when limit and page are provided', () => {
      const params = { limit: '20', page: '3' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser.build();

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(20);
      expect((pagination as ClassicPage).page).toBe(3);
    });

    it('should parse ClassicPage from offset when limit and offset are provided', () => {
      const params = { limit: '50', offset: '100' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser.build();

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(50);
      expect((pagination as ClassicPage).page).toBe(3); // offset 100 / limit 50 + 1 = page 3
    });

    it('should enforce defensive MAX_PAGE_LIMIT in parsed paginations', () => {
      const paramsPage = { limit: '1000', page: '2' };
      const parserPage = new QueryParamsParse<any>(paramsPage);
      const paginationPage = parserPage.build().pagination;

      expect(paginationPage?.limit).toBe(MAX_PAGE_LIMIT); // Capped at MAX_PAGE_LIMIT (250)

      const paramsCursor = { limit: '9999', cursor: 'c_xyz' };
      const parserCursor = new QueryParamsParse<any>(paramsCursor);
      const paginationCursor = parserCursor.build().pagination;

      expect(paginationCursor?.limit).toBe(MAX_PAGE_LIMIT); // Capped at MAX_PAGE_LIMIT (250)
    });
  });

  describe('asRsqlOperatorsObject Conversion', () => {
    it('should successfully transform and merge parsed parameters into operational objects', () => {
      const params = { name: '==John', age: 'gt=18' };
      const parser = new QueryParamsParse<UserTest>(params);
      const result = parser.asRsqlOperatorsObject();

      expect(result).toBeDefined();
      expect(result.name).toEqual({ equals: 'John' });
      expect(result.age).toEqual({ gt: 18 });
    });
  });
});
