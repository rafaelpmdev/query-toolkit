import { Nullable } from '@raicampos/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveValueType } from '../../common/types/primitive-value';

export interface CursorItem {
  column: string;
  value: PrimitiveValueType;
  direction: 'asc' | 'desc';
}

export class ClauseCursor extends Clause {
  constructor(private readonly items: CursorItem[]) {
    super();
    if (!items || items.length === 0) {
      throw new Error('Cursor items must not be empty');
    }
  }

  build(option?: { startParamIndex?: number }) {
    let index = option?.startParamIndex ?? 1;
    const params: Nullable<PrimitiveValueType>[] = [];

    // Algoritmo recursivo universal para Keyset Pagination de múltiplos campos
    // Ex: (col1 > val1) OR (col1 = val1 AND col2 > val2) ...
    const buildKeysetSql = (depth: number): string => {
      const item = this.items[depth];
      const operator = item.direction === 'asc' ? '>' : '<';

      if (depth === 0) {
        params.push(item.value);
        return `${item.column} ${operator} $${index++}`;
      }

      const prevSql = buildKeysetSql(depth - 1);

      params.push(item.value);
      const currentCondition = `${item.column} ${operator} $${index++}`;

      const equalityConditions: string[] = [];
      for (let i = 0; i < depth; i++) {
        const prevItem = this.items[i];
        params.push(prevItem.value);
        equalityConditions.push(`${prevItem.column} = $${index++}`);
      }

      const equalitySql = equalityConditions.join(' AND ');

      return `(${prevSql}) OR (${equalitySql} AND ${currentCondition})`;
    };

    const sql = buildKeysetSql(this.items.length - 1);

    return {
      sql,
      params,
    };
  }
}
