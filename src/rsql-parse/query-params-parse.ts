import { coalesce, isEmpty, ObjectEntries } from '@raicamposs/toolkit';
import { ClassicPage, CursorPage, SortDirection, SortParser } from '../common';
import { QueryParamsOperator } from '../query-operator';
import { QueryableFields, RsqlQueryParams } from '../types';
import { OperatorRegistry } from './operator-registry';

export type ParamsOperators<T extends object> = Record<
  Exclude<QueryableFields<T>, 'sort' | 'limit' | 'offset' | 'page' | 'cursor'>,
  Array<QueryParamsOperator>
>;

export type QueryParams<T extends object> = {
  params: ParamsOperators<T>;
  sort?: Record<QueryableFields<T>, SortDirection>;
  pagination?: ClassicPage | CursorPage;
};

export class QueryParamsParse<T extends object> {
  private readonly validKeys: Set<QueryableFields<T>>;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    shape?: { [K in QueryableFields<T>]: true }
  ) {
    this.validKeys = new Set(shape ? (Object.keys(shape) as QueryableFields<T>[]) : []);
  }

  build(): QueryParams<T> {
    return {
      params: this.buildParams(),
      sort: this.buildSort(),
      pagination: this.buildPagination(),
    };
  }

  private buildSort(): Record<QueryableFields<T>, SortDirection> | undefined {
    if ('sort' in this.params) {
      if (typeof this.params.sort !== 'string') {
        return undefined;
      }

      const sort = SortParser.parse(this.params.sort);

      return ObjectEntries(sort).reduce(
        (acc, [key, value]) => {
          if (this.validKeys.size === 0 || this.validKeys.has(key as QueryableFields<T>)) {
            acc[key as QueryableFields<T>] = value;
          }
          return acc;
        },
        {} as Record<QueryableFields<T>, SortDirection>
      );
    }

    return undefined;
  }

  private extractNumericParam(param: unknown): number | undefined {
    if (typeof param !== 'string' && typeof param !== 'number') return undefined;
    const num = Number(param);
    return Number.isNaN(num) ? undefined : num;
  }

  private buildPagination(): ClassicPage | CursorPage | undefined {
    if ('limit' in this.params && 'page' in this.params) {
      const limit = this.extractNumericParam(this.params.limit);
      const page = this.extractNumericParam(this.params.page);
      if (limit === undefined || page === undefined) return undefined;
      return new ClassicPage(limit, page);
    }

    if ('limit' in this.params && 'offset' in this.params) {
      const limit = this.extractNumericParam(this.params.limit);
      const offset = this.extractNumericParam(this.params.offset);
      if (limit === undefined || offset === undefined) return undefined;
      return ClassicPage.fromOffset(offset, limit);
    }

    if ('limit' in this.params || 'cursor' in this.params) {
      const limit = 'limit' in this.params ? this.extractNumericParam(this.params.limit) : 20;
      const cursorValue = 'cursor' in this.params ? this.params.cursor : undefined;
      const cursor = typeof cursorValue === 'string' ? cursorValue : undefined;
      if (limit === undefined) return undefined;
      return new CursorPage(limit, cursor);
    }

    return undefined;
  }

  private buildParams(): ParamsOperators<T> {
    const IGNORED_KEYS = ['sort', 'limit', 'offset', 'page', 'cursor'];
    const output: Record<string, Array<QueryParamsOperator>> = {};
    ObjectEntries(coalesce(this.params, {})).reduce((acc, [key, value]) => {
      if (isEmpty(value)) return acc;
      if (isEmpty(key)) return acc;
      if (IGNORED_KEYS.includes(key as string)) return acc;

      if (this.validKeys.size > 0 && !this.validKeys.has(key as QueryableFields<T>)) return acc;

      if (Array.isArray(value)) {
        if (!acc[key]) {
          acc[key] = [];
        }
        value.forEach((item: string) => {
          acc[key].push(OperatorRegistry.resolve(item));
        });
        return acc;
      }
      acc[key] = [OperatorRegistry.resolve(value as string)];
      return acc;
    }, output);

    return output as Record<QueryableFields<T>, Array<QueryParamsOperator>>;
  }

  /**
   * Converte os parâmetros RSQL parsados em um objeto com operadores.
   * @returns Objeto com os operadores RSQL.
   */
  asRsqlOperatorsObject() {
    const queryParams: Record<string, Array<QueryParamsOperator>> = this.buildParams();
    return ObjectEntries(queryParams)
      .map(([key, value]) => {
        const query = value
          .map((v) => v.query())
          .reduce(
            (acc, curr) => {
              if (curr) {
                Object.assign(acc, curr);
              }
              return acc;
            },
            {} as Record<string, unknown>
          );
        return { [key]: query };
      })
      .reduce((acc, curr) => Object.assign(acc, curr), {} as Record<string, unknown>);
  }
}
