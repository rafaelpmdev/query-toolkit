export interface SqlBuilderConfig {
  maxWhereClauses: number;
  maxOrderByClauses: number;
  maxGroupByClauses: number;
  maxLimit: number;
  /** Maximum number of JOIN clauses allowed (default: 8) */
  maxJoins: number;
  /** Whether to format SQL spacing. Disable for maximum performance. (default: true) */
  prettyPrint?: boolean;
  /** Emits warnings when potential SQL injection vulnerabilities are detected. (default: true in non-prod) */
  enableSecurityWarnings?: boolean;
}
