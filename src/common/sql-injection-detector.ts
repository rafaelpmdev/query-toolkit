/**
 * This class can be configured to either log warnings or throw errors (strict mode)
 * when dangerous patterns are detected.
 */

export interface Logger {
  warn(message: string): void;
}

export interface DetectorConfig {
  /**
   * If true, detectAndWarn will throw an error instead of logging a warning.
   * Default: false
   */
  strictMode: boolean;
  /**
   * Optional custom logger implementation to delegate warnings.
   */
  logger?: Logger;
}

export class SqlInjectionDetector {
  private static config: DetectorConfig = {
    strictMode: false,
  };

  // Dangerous SQL patterns for detection
  private static readonly DANGEROUS_PATTERNS = [
    /(^|\s)--/, // SQL comment (requires start of line or space before)
    /\/\*/, // Multi-line comment start
    /\*\//, // Multi-line comment end
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)/i, // Dangerous commands after semicolon
    /UNION\s+(ALL\s+)?SELECT/i, // UNION injection
    /\b(OR|AND)\s+(['"]?\w+['"]?)\s*(=|!=|<>)\s*\2/i, // Boolean injection where both sides are identical (e.g., OR 1=1, AND 'a'='a')
    /\b(OR|AND)\s+(TRUE|FALSE|1\s*=\s*1|0\s*=\s*1)\b/i, // Common boolean variations
    /\b(WAITFOR\s+DELAY|SLEEP|BENCHMARK)\b/i, // Time-based injection
  ];

  /**
   * Configures the detector behaviour
   *
   * @param config - Partial configuration object
   */
  static configure(config: Partial<DetectorConfig>): void {
    SqlInjectionDetector.config = {
      ...SqlInjectionDetector.config,
      ...config,
    };
  }

  /**
   * Detects potentially dangerous SQL patterns in a string
   *
   * @param value - String to check for SQL injection patterns
   * @returns true if dangerous pattern detected, false otherwise
   */
  static detect(value: string): boolean {
    for (const pattern of SqlInjectionDetector.DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detects and logs warning if dangerous patterns are found.
   * If strictMode is enabled, it throws an error instead.
   *
   * @param value - String to check
   * @throws Error if dangerous pattern detected and strictMode is enabled
   */
  static detectAndWarn(value: string): void {
    if (SqlInjectionDetector.detect(value)) {
      const message = `[SQL Security Warning] Potentially dangerous pattern detected in value: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;

      if (SqlInjectionDetector.config.strictMode) {
        throw new Error(message);
      }

      if (SqlInjectionDetector.config.logger) {
        SqlInjectionDetector.config.logger.warn(message);
      } else {
        // eslint-disable-next-line no-console
        console.warn(message);
      }
    }
  }
}
