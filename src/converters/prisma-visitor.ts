import { isNullOrUndefined } from '@raicamposs/toolkit';
import type { ArrayContainsOperator } from '../query-operator/array-contains-operator';
import type { ArrayIsContainedByOperator } from '../query-operator/array-is-contained-by-operator';
import type { ArrayOverlapOperator } from '../query-operator/array-overlap-operator';
import type { BetweenOperator } from '../query-operator/between-operator';
import type { ContainsOperator } from '../query-operator/contains-operator';
import type { EqualsOperator } from '../query-operator/equals-operator';
import type { GreaterThanOperator } from '../query-operator/greater-than-operator';
import type { GreaterThanOrEqualsOperator } from '../query-operator/greater-than-or-equals-operator';
import type { InOperator } from '../query-operator/in-operator';
import type { LessThanOperator } from '../query-operator/less-than-operator';
import type { LessThanOrEqualOperator } from '../query-operator/less-than-or-equals-operator';
import type { NotContainsOperator } from '../query-operator/not-contains-operator';
import type { NotEqualsOperator } from '../query-operator/not-equals-operator';
import type { NotInOperator } from '../query-operator/not-in-operator';
import type { UnknownOperator } from '../query-operator/unknown-operator';
import type { OperatorVisitor } from './operator-visitor';

export type PrismaWhereValue =
  | unknown
  | { not: unknown }
  | { in: unknown[] }
  | { notIn: unknown[] }
  | { gt: unknown }
  | { gte: unknown }
  | { lt: unknown }
  | { lte: unknown }
  | { contains: string; mode: 'insensitive' }
  | { not: { contains: string; mode: 'insensitive' } }
  | { gte: unknown; lte: unknown }
  | { hasEvery: unknown[] }
  | { hasSome: unknown[] }
  | { has: unknown };

export type PrismaWhereClause = Record<string, PrismaWhereValue>;

/**
 * Visitor implementation that converts QueryParamsOperator to Prisma where clauses
 */
export class PrismaVisitor implements OperatorVisitor<PrismaWhereClause> {
  visitEquals(operator: EqualsOperator, field: string): PrismaWhereClause {
    return { [field]: operator.value() };
  }

  visitNotEquals(operator: NotEqualsOperator, field: string): PrismaWhereClause {
    return { [field]: { not: operator.value() } };
  }

  visitIn(operator: InOperator, field: string): PrismaWhereClause {
    return { [field]: { in: operator.value() } };
  }

  visitNotIn(operator: NotInOperator, field: string): PrismaWhereClause {
    return { [field]: { notIn: operator.value() } };
  }

  visitGreaterThan(operator: GreaterThanOperator, field: string): PrismaWhereClause {
    return { [field]: { gt: operator.value() } };
  }

  visitGreaterThanOrEquals(
    operator: GreaterThanOrEqualsOperator,
    field: string
  ): PrismaWhereClause {
    return { [field]: { gte: operator.value() } };
  }

  visitLessThan(operator: LessThanOperator, field: string): PrismaWhereClause {
    return { [field]: { lt: operator.value() } };
  }

  visitLessThanOrEquals(operator: LessThanOrEqualOperator, field: string): PrismaWhereClause {
    return { [field]: { lte: operator.value() } };
  }

  visitContains(operator: ContainsOperator, field: string): PrismaWhereClause {
    return {
      [field]: {
        contains: operator.value() as string,
        mode: 'insensitive',
      },
    };
  }

  visitNotContains(operator: NotContainsOperator, field: string): PrismaWhereClause {
    return {
      [field]: {
        not: {
          contains: operator.value() as string,
          mode: 'insensitive',
        },
      },
    };
  }

  visitBetween(operator: BetweenOperator, field: string): PrismaWhereClause {
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

    return {
      [field]: {
        gte: value[0],
        lte: value[1],
      },
    };
  }

  visitArrayContains(operator: ArrayContainsOperator, field: string): PrismaWhereClause {
    const value = operator.value();

    if (Array.isArray(value)) {
      return { [field]: { hasEvery: value } };
    }

    return { [field]: { has: value } };
  }

  visitArrayIsContainedBy(_operator: ArrayIsContainedByOperator, field: string): PrismaWhereClause {
    throw new Error(
      `The "is contained by" array operator is not natively supported by Prisma on field "${field}". Use raw query execution instead.`
    );
  }

  visitArrayOverlap(operator: ArrayOverlapOperator, field: string): PrismaWhereClause {
    const value = operator.value();

    if (Array.isArray(value)) {
      return { [field]: { hasSome: value } };
    }

    return { [field]: { has: value } };
  }

  visitUnknown(operator: UnknownOperator, field: string): PrismaWhereClause {
    // For unknown operators, try to use the value directly
    const value = operator.value();

    if (isNullOrUndefined(value)) {
      return {};
    }

    return { [field]: value };
  }
}
