import { isNullOrUndefined } from '@raicamposs/toolkit';
import type { ArrayContainsOperator } from '../../../query-operator/operators/array-contains-operator';
import type { ArrayIsContainedByOperator } from '../../../query-operator/operators/array-is-contained-by-operator';
import type { ArrayOverlapOperator } from '../../../query-operator/operators/array-overlap-operator';
import type { BetweenOperator } from '../../../query-operator/operators/between-operator';
import type { ContainsOperator } from '../../../query-operator/operators/contains-operator';
import type { EqualsOperator } from '../../../query-operator/operators/equals-operator';
import type { GreaterThanOperator } from '../../../query-operator/operators/greater-than-operator';
import type { GreaterThanOrEqualsOperator } from '../../../query-operator/operators/greater-than-or-equals-operator';
import type { InOperator } from '../../../query-operator/operators/in-operator';
import type { LessThanOperator } from '../../../query-operator/operators/less-than-operator';
import type { LessThanOrEqualOperator } from '../../../query-operator/operators/less-than-or-equals-operator';
import type { NotContainsOperator } from '../../../query-operator/operators/not-contains-operator';
import type { NotEqualsOperator } from '../../../query-operator/operators/not-equals-operator';
import type { NotInOperator } from '../../../query-operator/operators/not-in-operator';
import type { UnknownOperator } from '../../../query-operator/operators/unknown-operator';
import { Clause } from '../../../sql-builder/core/clause';
import {
  ClauseArrayContains,
  ClauseArrayIsContainedBy,
  ClauseArrayOverlap,
  ClauseBetween,
  ClauseEmpty,
  ClauseEquals,
  ClauseGreaterThan,
  ClauseGreaterThanOrEquals,
  ClauseILike,
  ClauseIn,
  ClauseLessThan,
  ClauseLessThanOrEquals,
  ClauseNotEquals,
  ClauseNotILike,
  ClauseNotIn,
} from '../../../sql-builder/implementations';
import type { OperatorVisitor } from '../../core/operator-visitor';

/**
 * Visitor implementation that converts QueryParamsOperator to SQL Clause objects
 */
export class ClauseVisitor implements OperatorVisitor<Clause> {
  visitEquals(operator: EqualsOperator, field: string): Clause {
    return new ClauseEquals(field, operator.value());
  }

  visitNotEquals(operator: NotEqualsOperator, field: string): Clause {
    return new ClauseNotEquals(field, operator.value());
  }

  visitIn(operator: InOperator, field: string): Clause {
    const value = operator.value();
    return new ClauseIn(field, Array.isArray(value) ? value : [value]);
  }

  visitNotIn(operator: NotInOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseNotIn(field, values);
  }

  visitGreaterThan(operator: GreaterThanOperator, field: string): Clause {
    return new ClauseGreaterThan(field, operator.value());
  }

  visitGreaterThanOrEquals(operator: GreaterThanOrEqualsOperator, field: string): Clause {
    return new ClauseGreaterThanOrEquals(field, operator.value());
  }

  visitLessThan(operator: LessThanOperator, field: string): Clause {
    return new ClauseLessThan(field, operator.value());
  }

  visitLessThanOrEquals(operator: LessThanOrEqualOperator, field: string): Clause {
    return new ClauseLessThanOrEquals(field, operator.value());
  }

  visitContains(operator: ContainsOperator, field: string): Clause {
    return new ClauseILike(field, `%${operator.value()}%`);
  }

  visitNotContains(operator: NotContainsOperator, field: string): Clause {
    return new ClauseNotILike(field, `%${operator.value()}%`);
  }

  visitBetween(operator: BetweenOperator, field: string): Clause {
    const value = operator.value();

    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      isNullOrUndefined(value[0]) ||
      isNullOrUndefined(value[1])
    ) {
      throw new Error(
        `Invalid value for Between operator on field "${field}". Expected an array with 2 elements.`
      );
    }

    return new ClauseBetween(field, value[0], value[1]);
  }

  visitArrayContains(operator: ArrayContainsOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayContains(field, values);
  }

  visitArrayIsContainedBy(operator: ArrayIsContainedByOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayIsContainedBy(field, values);
  }

  visitArrayOverlap(operator: ArrayOverlapOperator, field: string): Clause {
    const value = operator.value();
    const values = Array.isArray(value) ? value : [value];
    return new ClauseArrayOverlap(field, values);
  }

  visitUnknown(operator: UnknownOperator, field: string): Clause {
    const value = operator.value();

    if (isNullOrUndefined(value)) {
      return new ClauseEmpty();
    }

    return new ClauseEquals(field, value);
  }
}
