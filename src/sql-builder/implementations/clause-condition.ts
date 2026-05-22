import { isNullOrUndefined, Nullable } from '@raicamposs/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveArrayValue } from '../core/primitive-array-value';
import { PrimitiveValue, PrimitiveValueTypes } from '../core/primitive-value';
import { TransformFunction } from '../core/transform-function';

export type Condition = {
  [key: string]: string | number | Date | boolean | Array<string | number | Date | boolean>;
};

export class ClauseCondition extends Clause {
  constructor(
    private readonly field: string,
    private readonly condition: Condition,
    private readonly transformFunction?: TransformFunction
  ) {
    super();
  }

  build(option?: { startParamIndex?: number }) {
    if (isNullOrUndefined(this.field) || isNullOrUndefined(this.condition)) return undefined;

    let paramIndex = option?.startParamIndex ?? 1;
    const allParams: Nullable<PrimitiveValueTypes>[] = [];

    if (!(this.condition instanceof Object)) {
      const value = new PrimitiveValue(this.condition, this.transformFunction).toValue();
      const built = this.transformParameterized('equals', value, paramIndex);
      return built;
    }

    if (this.condition instanceof Date) {
      const value = new PrimitiveValue(this.condition, this.transformFunction).toValue();
      const built = this.transformParameterized('equals', value, paramIndex);
      return built;
    }

    const parts: string[] = [];

    for (const filter of Object.keys(this.condition)) {
      const conditionValue = this.condition[filter];
      let value: Nullable<PrimitiveValueTypes> | Nullable<PrimitiveValueTypes>[];

      if (Array.isArray(conditionValue)) {
        value = new PrimitiveArrayValue(conditionValue, this.transformFunction).toValue();
      } else {
        value = new PrimitiveValue(conditionValue, this.transformFunction).toValue();
      }

      const built = this.transformParameterized(filter, value, paramIndex);

      if (built) {
        parts.push(`(${built.sql})`);
        allParams.push(...built.params);
        paramIndex += built.params.length;
      }
    }

    if (parts.length === 0) return undefined;
    return {
      sql: parts.join(' AND '),
      params: allParams,
    };
  }

  private transformParameterized(
    filter: string,
    value: Nullable<PrimitiveValueTypes> | Nullable<PrimitiveValueTypes>[],
    paramIndex: number
  ): { sql: string; params: Nullable<PrimitiveValueTypes>[] } | undefined {
    if (isNullOrUndefined(value)) return undefined;

    switch (filter) {
      case 'equals':
        return {
          sql: `${this.field} = $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'notEquals':
        return {
          sql: `${this.field} <> $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'notContains':
        return {
          sql: `not ${this.field} ilike $${paramIndex}`,
          params: [`%${value}%`],
        };

      case 'contains':
        return {
          sql: `${this.field} ilike $${paramIndex}`,
          params: [`%${value}%`],
        };

      case 'in': {
        if (!Array.isArray(value) || value.length === 0) return undefined;
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
        return {
          sql: `${this.field} in (${placeholders})`,
          params: value as unknown as Nullable<PrimitiveValueTypes>[],
        };
      }

      case 'notIn': {
        if (!Array.isArray(value) || value.length === 0) return undefined;
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
        return {
          sql: `not ${this.field} in (${placeholders})`,
          params: value as unknown as Nullable<PrimitiveValueTypes>[],
        };
      }

      case 'gt':
        return {
          sql: `${this.field} > $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'gte':
        return {
          sql: `${this.field} >= $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'lt':
        return {
          sql: `${this.field} < $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'lte':
        return {
          sql: `${this.field} <= $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };

      case 'arrayContains':
        return this.buildWhereArrayParameterized(
          this.field,
          value as unknown as Nullable<PrimitiveValueTypes>[],
          '@>',
          paramIndex
        );

      case 'arrayIsContainedBy':
        return this.buildWhereArrayParameterized(
          this.field,
          value as unknown as Nullable<PrimitiveValueTypes>[],
          '<@',
          paramIndex
        );

      case 'arrayOverlap':
        return this.buildWhereArrayParameterized(
          this.field,
          value as unknown as Nullable<PrimitiveValueTypes>[],
          '&&',
          paramIndex
        );

      default:
        return {
          sql: `${this.field} = $${paramIndex}`,
          params: [value as unknown as Nullable<PrimitiveValueTypes>],
        };
    }
  }

  private buildWhereArrayParameterized(
    field: string,
    value: Nullable<PrimitiveValueTypes>[],
    operador: string,
    paramIndex: number
  ) {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');

    return {
      sql: `
      CASE
        WHEN 
          pg_typeof(${field})::text = 'text' or
          pg_typeof(${field})::text = 'varchar' 
        THEN string_to_array(${field}::text, ',') ${operador} ARRAY [ ${placeholders} ]
        ELSE ${field}::text[] ${operador} ARRAY [ ${placeholders} ]
      END
    `.trim(),
      params: value,
    };
  }
}
