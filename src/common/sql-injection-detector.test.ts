import { describe, expect, it, vi } from 'vitest';
import { SqlInjectionDetector } from './sql-injection-detector';

describe('SqlInjectionDetector', () => {
  describe('detect', () => {
    describe('SQL comments', () => {
      it('should detect single-line comment with space', () => {
        expect(SqlInjectionDetector.detect('test -- comment')).toBe(true);
      });

      it('should detect single-line comment at start of string', () => {
        expect(SqlInjectionDetector.detect('-- comment')).toBe(true);
      });

      it('should NOT detect double-dash inside word (false positive fix)', () => {
        expect(SqlInjectionDetector.detect('report--2024')).toBe(false);
      });

      it('should detect multi-line comment start', () => {
        expect(SqlInjectionDetector.detect('test /* comment')).toBe(true);
      });

      it('should detect multi-line comment end', () => {
        expect(SqlInjectionDetector.detect('test */ comment')).toBe(true);
      });
    });

    describe('dangerous commands after semicolon', () => {
      it('should detect DROP after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; DROP TABLE users')).toBe(true);
      });

      it('should detect DELETE after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; DELETE FROM users')).toBe(true);
      });

      it('should detect UPDATE after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; UPDATE users SET')).toBe(true);
      });

      it('should detect INSERT after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; INSERT INTO users')).toBe(true);
      });

      it('should detect ALTER after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; ALTER TABLE users')).toBe(true);
      });

      it('should detect CREATE after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; CREATE TABLE users')).toBe(true);
      });

      it('should detect TRUNCATE after semicolon', () => {
        expect(SqlInjectionDetector.detect('test; TRUNCATE TABLE users')).toBe(true);
      });

      it('should be case-insensitive for dangerous commands', () => {
        expect(SqlInjectionDetector.detect('test; drop table users')).toBe(true);
        expect(SqlInjectionDetector.detect('test; DrOp TaBlE users')).toBe(true);
      });
    });

    describe('UNION injection', () => {
      it('should detect UNION SELECT', () => {
        expect(SqlInjectionDetector.detect('test UNION SELECT password')).toBe(true);
      });

      it('should be case-insensitive for UNION', () => {
        expect(SqlInjectionDetector.detect('test union select password')).toBe(true);
        expect(SqlInjectionDetector.detect('test UnIoN SeLeCt password')).toBe(true);
      });
    });

    describe('OR/AND injection', () => {
      it('should detect OR 1=1', () => {
        expect(SqlInjectionDetector.detect("' OR 1=1")).toBe(true);
      });

      it('should detect OR 1 = 1 with spaces', () => {
        expect(SqlInjectionDetector.detect("' OR 1 = 1")).toBe(true);
      });

      it('should detect OR 2=2', () => {
        expect(SqlInjectionDetector.detect("' OR 2=2")).toBe(true);
      });

      it('should detect OR \"a\"=\"a\"', () => {
        expect(SqlInjectionDetector.detect('\' OR "a"="a"')).toBe(true);
      });

      it('should detect OR TRUE', () => {
        expect(SqlInjectionDetector.detect("' OR TRUE")).toBe(true);
      });

      it('should detect AND 1=1', () => {
        expect(SqlInjectionDetector.detect("' AND 1=1")).toBe(true);
      });

      it('should detect AND 1 = 1 with spaces', () => {
        expect(SqlInjectionDetector.detect("' AND 1 = 1")).toBe(true);
      });

      it('should be case-insensitive for OR/AND', () => {
        expect(SqlInjectionDetector.detect("' or 1=1")).toBe(true);
        expect(SqlInjectionDetector.detect("' and 1=1")).toBe(true);
      });
    });

    describe('Time-based injection', () => {
      it('should detect WAITFOR DELAY', () => {
        expect(SqlInjectionDetector.detect("test; WAITFOR DELAY '0:0:5'")).toBe(true);
      });

      it('should detect SLEEP', () => {
        expect(SqlInjectionDetector.detect('test; SELECT SLEEP(5)')).toBe(true);
      });
    });

    describe('safe values', () => {
      it('should not detect injection in normal text', () => {
        expect(SqlInjectionDetector.detect('John Doe')).toBe(false);
      });

      it('should not detect injection in email', () => {
        expect(SqlInjectionDetector.detect('user@example.com')).toBe(false);
      });

      it('should not detect injection in numbers', () => {
        expect(SqlInjectionDetector.detect('12345')).toBe(false);
      });

      it('should not detect injection in simple text with apostrophe', () => {
        expect(SqlInjectionDetector.detect("O'Brien")).toBe(false);
      });

      it('should not detect injection in words containing OR/AND', () => {
        expect(SqlInjectionDetector.detect('NORMAL')).toBe(false);
        expect(SqlInjectionDetector.detect('BAND')).toBe(false);
        expect(SqlInjectionDetector.detect('DOOR')).toBe(false);
      });

      it('should not detect injection in empty string', () => {
        expect(SqlInjectionDetector.detect('')).toBe(false);
      });
    });
  });

  describe('detectAndWarn', () => {
    it('should log warning when dangerous pattern is detected and strictMode is false', () => {
      SqlInjectionDetector.configure({ strictMode: false });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      SqlInjectionDetector.detectAndWarn('test -- comment');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SQL Security Warning]')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('test -- comment'));

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when dangerous pattern is detected and strictMode is true', () => {
      SqlInjectionDetector.configure({ strictMode: true });

      expect(() => {
        SqlInjectionDetector.detectAndWarn('test -- comment');
      }).toThrow('[SQL Security Warning]');

      // Reset config for other tests
      SqlInjectionDetector.configure({ strictMode: false });
    });

    it('should not log warning or throw for safe values', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      SqlInjectionDetector.detectAndWarn('safe value');

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should truncate long values in warning message', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const longValue = 'a'.repeat(100) + ' -- comment';

      SqlInjectionDetector.detectAndWarn(longValue);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('...'));

      consoleWarnSpy.mockRestore();
    });

    it('should delegate warning to custom logger when provided', () => {
      const customLogger = {
        warn: vi.fn(),
      };
      SqlInjectionDetector.configure({ strictMode: false, logger: customLogger });

      SqlInjectionDetector.detectAndWarn('test -- comment');

      expect(customLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SQL Security Warning]')
      );

      // Cleanup custom logger configuration
      SqlInjectionDetector.configure({ logger: undefined });
    });
  });

  describe('configure', () => {
    it('should update strictMode configuration', () => {
      SqlInjectionDetector.configure({ strictMode: true });

      expect(() => {
        SqlInjectionDetector.detectAndWarn('test -- comment');
      }).toThrow();

      SqlInjectionDetector.configure({ strictMode: false });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      SqlInjectionDetector.detectAndWarn('test -- comment');
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
