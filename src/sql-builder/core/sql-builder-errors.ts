/**
 * Domain-specific error hierarchy for SqlBuilder.
 *
 * Using a typed hierarchy instead of generic Error allows callers to distinguish
 * builder errors from runtime failures without inspecting error messages.
 *
 * @example
 * try {
 *   builder.join('orders', 'users.id', 'orders.user_id');
 * } catch (err) {
 *   if (err instanceof DuplicateJoinError) { ... }
 *   if (err instanceof MaxClausesExceededError) { ... }
 * }
 */

export class SqlBuilderError extends Error {
  override readonly name: string = 'SqlBuilderError';

  constructor(message: string) {
    super(message);
    // Maintains proper prototype chain in compiled JavaScript targets below ES2015
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a configured clause count limit (WHERE, JOIN, ORDER BY, GROUP BY) is exceeded. */
export class MaxClausesExceededError extends RangeError {
  override readonly name: string = 'MaxClausesExceededError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the same table is joined more than once via a structured join method. */
export class DuplicateJoinError extends RangeError {
  override readonly name: string = 'DuplicateJoinError';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a cursor string cannot be decoded or is structurally invalid. */
export class InvalidCursorError extends SqlBuilderError {
  override readonly name: string = 'InvalidCursorError';
}
