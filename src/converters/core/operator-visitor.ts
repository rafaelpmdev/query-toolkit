import type { ArrayContainsOperator } from '../../query-operator/operators/array-contains-operator';
import type { ArrayIsContainedByOperator } from '../../query-operator/operators/array-is-contained-by-operator';
import type { ArrayOverlapOperator } from '../../query-operator/operators/array-overlap-operator';
import type { BetweenOperator } from '../../query-operator/operators/between-operator';
import type { ContainsOperator } from '../../query-operator/operators/contains-operator';
import type { EqualsOperator } from '../../query-operator/operators/equals-operator';
import type { GreaterThanOperator } from '../../query-operator/operators/greater-than-operator';
import type { GreaterThanOrEqualsOperator } from '../../query-operator/operators/greater-than-or-equals-operator';
import type { InOperator } from '../../query-operator/operators/in-operator';
import type { LessThanOperator } from '../../query-operator/operators/less-than-operator';
import type { LessThanOrEqualOperator } from '../../query-operator/operators/less-than-or-equals-operator';
import type { NotContainsOperator } from '../../query-operator/operators/not-contains-operator';
import type { NotEqualsOperator } from '../../query-operator/operators/not-equals-operator';
import type { NotInOperator } from '../../query-operator/operators/not-in-operator';
import type { UnknownOperator } from '../../query-operator/operators/unknown-operator';

/**
 * Visitor interface for converting QueryParamsOperator to different formats
 * @template T - The return type of the visitor methods
 */
export interface OperatorVisitor<T> {
  visitEquals(operator: EqualsOperator, field: string): T;
  visitNotEquals(operator: NotEqualsOperator, field: string): T;
  visitIn(operator: InOperator, field: string): T;
  visitNotIn(operator: NotInOperator, field: string): T;
  visitGreaterThan(operator: GreaterThanOperator, field: string): T;
  visitGreaterThanOrEquals(operator: GreaterThanOrEqualsOperator, field: string): T;
  visitLessThan(operator: LessThanOperator, field: string): T;
  visitLessThanOrEquals(operator: LessThanOrEqualOperator, field: string): T;
  visitContains(operator: ContainsOperator, field: string): T;
  visitNotContains(operator: NotContainsOperator, field: string): T;
  visitBetween(operator: BetweenOperator, field: string): T;
  visitArrayContains(operator: ArrayContainsOperator, field: string): T;
  visitArrayIsContainedBy(operator: ArrayIsContainedByOperator, field: string): T;
  visitArrayOverlap(operator: ArrayOverlapOperator, field: string): T;
  visitUnknown(operator: UnknownOperator, field: string): T;
}
