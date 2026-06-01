import { isNullOrUndefined, Nullable } from '@raicampos/toolkit';
import { Clause } from '../core/clause';
import { PrimitiveValueTypes } from '../core/primitive-value';

export class ClauseAnd extends Clause {
  private readonly value: Clause[] = [];

  constructor(...clauses: Clause[]) {
    super();
    this.value.push(...clauses);
  }

  addClause(clause: Clause): this {
    this.value.push(clause);
    return this;
  }

  build(option?: { startParamIndex?: number }) {
    if (isNullOrUndefined(this.value) || this.value.length === 0) return undefined;

    let currentIndex = option?.startParamIndex ?? 1;
    const parts: string[] = [];
    const allParams: Nullable<PrimitiveValueTypes>[] = [];

    for (const clause of this.value) {
      const built = clause.build({ startParamIndex: currentIndex });
      if (built) {
        parts.push(built.sql);
        allParams.push(...built.params);
        currentIndex += built.params.length;
      }
    }

    if (parts.length === 0) return undefined;

    return {
      sql: parts.length === 1 ? parts[0] : `(${parts.join(' AND ')})`,
      params: allParams,
    };
  }
}
