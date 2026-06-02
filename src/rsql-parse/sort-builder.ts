import { ObjectEntries } from '@raicampos/toolkit';
import { SortDirection, SortParser } from '../common';
import { QueryableFields } from '../common/types';

export class SortBuilder {
  public static build<T extends object>(
    params: Record<string, unknown>,
    validKeys: Map<QueryableFields<T>, string>
  ): Record<QueryableFields<T>, SortDirection> | undefined {
    if (!('sort' in params)) {
      return undefined;
    }

    if (typeof params.sort !== 'string') {
      return undefined;
    }

    const sort = SortParser.parse(params.sort);

    return ObjectEntries(sort).reduce(
      (acc, [key, value]) => {
        if (validKeys.size === 0 || validKeys.has(key as QueryableFields<T>)) {
          acc[key as QueryableFields<T>] = value;
        }
        return acc;
      },
      {} as Record<QueryableFields<T>, SortDirection>
    );
  }
}
