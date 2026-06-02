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
    const { operators: result } = parser;

    expect(result.name).toHaveLength(1);
    expect(result.name[0]).toBeInstanceOf(EqualsOperator);
    expect(result.age).toHaveLength(1);
    expect(result.age[0].symbol).toBe('gt=');
  });

  it('should handle array parameters', () => {
    const params = { status: ['==active', '==pending'] };
    const parser = new QueryParamsParse<UserTest>(params as any);
    const { operators: result } = parser;

    expect(result.status).toHaveLength(2);
    expect(result.status[0]).toBeInstanceOf(EqualsOperator);
    expect(result.status[1]).toBeInstanceOf(EqualsOperator);
  });

  it('should ignore empty values or keys', () => {
    const params = { name: '', '': '==value' };
    const parser = new QueryParamsParse<UserTest>(params);
    const { operators: result } = parser;

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
    const { operators: result } = parser;

    expect(result.field).toHaveLength(1);
    expect(result.field[0]).toBeInstanceOf(CustomFakeOperator);
    expect(result.field[0].value()).toBe('value');
  });

  describe('Shape and Key Filtering', () => {
    it('should only parse keys defined in shape schema', () => {
      const params = { name: '==John', age: 'gt=18', secret: '==forbidden' };
      const shape = { name: true, age: true } as any;
      const parser = new QueryParamsParse<UserTest>(params as any, shape);
      const { operators: result } = parser;

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
      const { sort } = parser;

      expect(sort).toBeDefined();
      expect(sort?.name).toBe('asc');
      expect(sort?.age).toBe('desc');
      expect((sort as any).secret).toBeUndefined();
    });

    it('should ignore sort if it is passed as an array (malformed params)', () => {
      const params = { sort: ['name:asc', 'age:desc'] };
      const parser = new QueryParamsParse<any>(params as any);
      const { sort } = parser;
      expect(sort).toBeUndefined();
    });
  });

  describe('Pagination Strategies', () => {
    it('should return undefined if no pagination parameters are sent', () => {
      const parser = new QueryParamsParse<any>({});
      const { pagination } = parser;
      expect(pagination).toBeUndefined();
    });

    it('should parse CursorPage when limit and cursor are provided', () => {
      const params = { limit: '15', cursor: 'eyJ2Ijp7ImlkIjo0Mn19' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(CursorPage);
      expect(pagination?.limit).toBe(15);
      expect((pagination as CursorPage).cursor).toBe('eyJ2Ijp7ImlkIjo0Mn19');
    });

    it('should parse ClassicPage when limit and page are provided', () => {
      const params = { limit: '20', page: '3' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(20);
      expect((pagination as ClassicPage).page).toBe(3);
    });

    it('should parse ClassicPage from offset when limit and offset are provided', () => {
      const params = { limit: '50', offset: '100' };
      const parser = new QueryParamsParse<any>(params);
      const { pagination } = parser;

      expect(pagination).toBeInstanceOf(ClassicPage);
      expect(pagination?.limit).toBe(50);
      expect((pagination as ClassicPage).page).toBe(3); // offset 100 / limit 50 + 1 = page 3
    });

    it('should enforce defensive MAX_PAGE_LIMIT in parsed paginations', () => {
      const paramsPage = { limit: '1000', page: '2' };
      const parserPage = new QueryParamsParse<any>(paramsPage);
      const paginationPage = parserPage.pagination;

      expect(paginationPage?.limit).toBe(MAX_PAGE_LIMIT); // Capped at MAX_PAGE_LIMIT (250)

      const paramsCursor = { limit: '9999', cursor: 'c_xyz' };
      const parserCursor = new QueryParamsParse<any>(paramsCursor);
      const paginationCursor = parserCursor.pagination;

      expect(paginationCursor?.limit).toBe(MAX_PAGE_LIMIT); // Capped at MAX_PAGE_LIMIT (250)
    });

    it('should gracefully handle arrays passed to cursor or offset', () => {
      // Limit is valid, offset is array (invalid) -> early return kicks in and pagination is gracefully ignored
      const paramsOffset = { limit: '50', offset: ['100', '200'] };
      const parserOffset = new QueryParamsParse<any>(paramsOffset as any);
      const paginationOffset = parserOffset.pagination;
      expect(paginationOffset).toBeUndefined();

      // Limit is valid, cursor is array (invalid) -> CursorPage without cursor
      const paramsCursor = { limit: '20', cursor: ['abc', 'def'] };
      const parserCursor = new QueryParamsParse<any>(paramsCursor as any);
      const paginationCursor = parserCursor.pagination;
      expect(paginationCursor).toBeInstanceOf(CursorPage);
      expect((paginationCursor as CursorPage).limit).toBe(20);
      expect((paginationCursor as CursorPage).cursor).toBeUndefined();
    });

    it('deve retornar paginação ignorada (undefined) quando arrays são passados onde números são esperados', () => {
      const params = { limit: ['10', '20'], page: ['1', '2'] };
      const parser = new QueryParamsParse<any>(params as any);
      const { pagination } = parser;
      expect(pagination).toBeUndefined();
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

  describe('Boolean Preprocessing', () => {
    interface BooleanTest {
      isActive: boolean;
      name: string;
    }

    it('should normalize boolean query values from string representations like S/N/TRUE/FALSE to boolean values', () => {
      const shape = { isActive: 'boolean', name: 'string' } as const;

      // S (true)
      const parser1 = new QueryParamsParse<BooleanTest>({ isActive: '==S' }, shape);
      expect(parser1.validate().success).toBe(true);
      expect(parser1.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      // N (false)
      const parser2 = new QueryParamsParse<BooleanTest>({ isActive: '==N' }, shape);
      expect(parser2.validate().success).toBe(true);
      expect(parser2.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      // TRUE (true)
      const parser3 = new QueryParamsParse<BooleanTest>({ isActive: '==TRUE' }, shape);
      expect(parser3.validate().success).toBe(true);
      expect(parser3.asRsqlOperatorsObject().isActive).toEqual({ equals: true });

      // FALSE (false)
      const parser4 = new QueryParamsParse<BooleanTest>({ isActive: '==FALSE' }, shape);
      expect(parser4.validate().success).toBe(true);
      expect(parser4.asRsqlOperatorsObject().isActive).toEqual({ equals: false });

      // In operators in=(S,N)
      const parser5 = new QueryParamsParse<BooleanTest>({ isActive: 'in=(S,N)' }, shape);
      expect(parser5.validate().success).toBe(true);
      expect(parser5.asRsqlOperatorsObject().isActive).toEqual({ in: [true, false] });

      // Should not touch string fields like name
      const parser6 = new QueryParamsParse<BooleanTest>({ name: '==S' }, shape);
      expect(parser6.validate().success).toBe(true);
      expect(parser6.asRsqlOperatorsObject().name).toEqual({ equals: 'S' });
    });
  });
});
