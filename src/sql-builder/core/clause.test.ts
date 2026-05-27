import { describe, expect, it, vi } from 'vitest';
import { Clause } from './clause';

// Need a concrete implementation to test the base class
class ConcreteClause extends Clause {
  build() {
    return { sql: 'build', params: [] };
  }
}

describe('Clause Base', () => {
  it('should set valueTransform', () => {
    const clause = new ConcreteClause();
    const transform = vi.fn().mockReturnValue('transformed');

    clause.withValueTransform(transform);
    // @ts-ignore - accessing protected for test
    expect(clause.valueTransform).toBe(transform);
  });
});
