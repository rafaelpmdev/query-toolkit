import { ObjectEntries } from '@raicampos/toolkit';
import { QueryableFields } from '../common/types';
import { QueryParamsOperator } from '../query-operator';
import type { ParamsOperators, FieldTypes } from './query-params-parse';

export class ParamValidator {
  public static validate<T extends object>(
    operatorsObj: ParamsOperators<T>,
    validKeys: Map<QueryableFields<T>, FieldTypes>
  ): { success: boolean; errors: string[] } {
    const validationErrors: string[] = [];
    for (const [field, operators] of ObjectEntries(operatorsObj)) {
      for (const operator of operators as Array<QueryParamsOperator<unknown, unknown>>) {
        const parseResult = operator.safeParse();

        if (!parseResult.success) {
          validationErrors.push(`Field '${field}': ${parseResult.error}`);
          continue;
        }

        const expectedType = validKeys.get(field as QueryableFields<T>);

        if (expectedType) {
          const value = operator.value();
          const baseType = expectedType.replace('[]', '');

          const checkType = (v: unknown) => {
            if (baseType === 'date') return v instanceof Date;
            return typeof v === baseType;
          };

          const isInvalid = Array.isArray(value)
            ? value.some((v) => !checkType(v))
            : !checkType(value);

          if (isInvalid) {
            validationErrors.push(`Field '${field}': expected type '${expectedType}'.`);
          }
        }
      }
    }

    return {
      success: validationErrors.length === 0,
      errors: validationErrors,
    };
  }
}
