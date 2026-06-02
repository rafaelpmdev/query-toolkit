import { RequireAtLeastOne } from '@raicampos/toolkit';
import {
  ArrayContainsCondition,
  ArrayIsContainedByCondition,
  ArrayOverlapCondition,
  BetweenCondition,
  ContainsCondition,
  EqualsCondition,
  GreaterThanCondition,
  GreaterThanOrEqualsCondition,
  InCondition,
  LessThanCondition,
  LessThanOrEqualsCondition,
  NotContainsCondition,
  NotEqualsCondition,
  NotInCondition,
} from './conditions';

export type NumberCondition = RequireAtLeastOne<
  Partial<
    EqualsCondition<number> &
      NotEqualsCondition<number> &
      InCondition<number> &
      NotInCondition<number> &
      GreaterThanCondition<number> &
      GreaterThanOrEqualsCondition<number> &
      LessThanCondition<number> &
      LessThanOrEqualsCondition<number> &
      BetweenCondition<number>
  >
>;

export type StringCondition = RequireAtLeastOne<
  Partial<
    EqualsCondition<string> &
      NotEqualsCondition<string> &
      InCondition<string> &
      NotInCondition<string> &
      ContainsCondition &
      NotContainsCondition<string>
  >
>;

export type BooleanCondition = RequireAtLeastOne<
  Partial<EqualsCondition<boolean> & NotEqualsCondition<boolean>>
>;

export type ArrayCondition = RequireAtLeastOne<
  Partial<ArrayContainsCondition & ArrayIsContainedByCondition & ArrayOverlapCondition>
>;

export type RsqlCondition = NumberCondition | StringCondition | BooleanCondition | ArrayCondition;
