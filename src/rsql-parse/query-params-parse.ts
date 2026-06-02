import { coalesce, isEmpty, ObjectEntries } from '@raicampos/toolkit';
import { ClassicPage, CursorPage, SortDirection } from '../common';
import { QueryableFields, RsqlQueryParams } from '../common/types';
import { QueryParamsOperator } from '../query-operator';
import { OperatorRegistry } from './operator-registry';
import { PaginationBuilder } from './pagination-builder';
import { SortBuilder } from './sort-builder';
import { ParamNormalizer } from './param-normalizer';
import { ParamValidator } from './param-validator';

import {
  ArrayCondition,
  BooleanCondition,
  NumberCondition,
  StringCondition,
} from '../common/types/rsql-condition';

export type FieldCondition<Val> = Val extends number
  ? NumberCondition
  : Val extends boolean
    ? BooleanCondition
    : Val extends unknown[]
      ? ArrayCondition
      : Val extends Date
        ? StringCondition
        : Val extends string
          ? StringCondition
          : unknown;

export type FieldValue<Val> = Val extends number
  ? number
  : Val extends boolean
    ? boolean
    : Val extends unknown[]
      ? string[]
      : Val extends Date
        ? string
        : Val extends string
          ? string
          : unknown;

export type ParamsOperators<T extends object> = {
  [K in Exclude<QueryableFields<T>, 'sort' | 'limit' | 'offset' | 'page' | 'cursor'>]: Array<
    QueryParamsOperator<FieldCondition<T[K]>, FieldValue<T[K]>>
  >;
};

export type QueryParams<T extends object> = {
  params: ParamsOperators<T>;
  sort?: Record<QueryableFields<T>, SortDirection>;
  pagination?: ClassicPage | CursorPage;
};

export type FieldTypes = 'string' | 'number' | 'boolean' | 'date';

export class QueryParamsParse<T extends object> {
  private readonly validKeys: Map<QueryableFields<T>, FieldTypes>;
  public readonly operators: ParamsOperators<T>;
  public readonly sort?: Record<QueryableFields<T>, SortDirection>;
  public readonly pagination?: ClassicPage | CursorPage;

  constructor(
    private readonly params: RsqlQueryParams<T>,
    private readonly shape?: Partial<Record<QueryableFields<T>, FieldTypes>>
  ) {
    this.validKeys = new Map(
      shape ? (Object.entries(shape) as [QueryableFields<T>, FieldTypes][]) : []
    );
    this.operators = this.buildParams();
    this.sort = SortBuilder.build(this.params, this.validKeys);
    this.pagination = PaginationBuilder.build(this.params);
  }

  get isClassicPage(): boolean {
    return this.pagination instanceof ClassicPage;
  }

  get isCursorPage(): boolean {
    return this.pagination instanceof CursorPage;
  }

  get hasPagination(): boolean {
    return !!this.pagination;
  }

  get hasSort(): boolean {
    return !!this.sort;
  }

  get hasOperators(): boolean {
    return ObjectEntries(this.operators).length > 0;
  }

  paginationAsClassicPage(defaultPage?: ClassicPage): ClassicPage | undefined {
    return this.isClassicPage ? (this.pagination as ClassicPage) : defaultPage;
  }

  paginationAsCursorPage(defaultPage?: CursorPage): CursorPage | undefined {
    return this.isCursorPage ? (this.pagination as CursorPage) : defaultPage;
  }

  public validate(): { success: boolean; errors: string[] } {
    return ParamValidator.validate(this.operators, this.validKeys);
  }

  private buildParams(): ParamsOperators<T> {
    const IGNORED_KEYS = ['sort', 'limit', 'offset', 'page', 'cursor'];
    const output: Record<string, Array<QueryParamsOperator<unknown, unknown>>> = {};
    ObjectEntries(coalesce(this.params, {})).reduce((acc, [key, value]) => {
      if (isEmpty(value)) return acc;
      if (isEmpty(key)) return acc;
      if (IGNORED_KEYS.includes(key as string)) return acc;

      if (this.validKeys.size > 0 && !this.validKeys.has(key as QueryableFields<T>)) return acc;

      const expectedType = this.validKeys.get(key as QueryableFields<T>);
      const isBoolean = expectedType === 'boolean';

      const normalizeValue = (val: string): string => {
        if (isBoolean) {
          return ParamNormalizer.normalizeRsqlBooleanString(val);
        }
        return val;
      };

      if (Array.isArray(value)) {
        if (!acc[key]) {
          acc[key] = [];
        }
        value.forEach((item: string) => {
          acc[key].push(OperatorRegistry.resolve(normalizeValue(item)));
        });
        return acc;
      }
      acc[key] = [OperatorRegistry.resolve(normalizeValue(value as string))];
      return acc;
    }, output);

    return output as unknown as ParamsOperators<T>;
  }

  /**
   * Converte os parâmetros RSQL parsados em um objeto com operadores.
   * @returns Objeto com os operadores RSQL.
   */
  asRsqlOperatorsObject() {
    const queryParams: Record<
      string,
      Array<QueryParamsOperator<unknown, unknown>>
    > = this.buildParams() as unknown as Record<
      string,
      Array<QueryParamsOperator<unknown, unknown>>
    >;
    return ObjectEntries(queryParams)
      .map(([key, value]) => {
        const query = value
          .map((v) => v.query())
          .reduce(
            (acc: Record<string, unknown>, curr) => {
              if (curr) {
                const currentObj = curr as Record<string, unknown>;
                for (const k in currentObj) {
                  if (Object.prototype.hasOwnProperty.call(currentObj, k)) {
                    acc[k] = currentObj[k];
                  }
                }
              }
              return acc;
            },
            {} as Record<string, unknown>
          );
        return { [key]: query };
      })
      .reduce(
        (acc: Record<string, unknown>, curr) => {
          const currentObj = curr as Record<string, unknown>;
          for (const k in currentObj) {
            if (Object.prototype.hasOwnProperty.call(currentObj, k)) {
              acc[k] = currentObj[k];
            }
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
  }
}
