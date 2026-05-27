import { describe, expect, it } from 'vitest';
import { ClassicPage } from './classic-page';

describe('Pagination', () => {
  describe('Constructor and Initialization', () => {
    it('should initialize with default values when no arguments are provided', () => {
      const pagination = new ClassicPage();
      expect(pagination.limit).toBe(10);
      expect(pagination.page).toBe(1);
      expect(pagination.total).toBeUndefined();
      expect(pagination.offset).toBe(0);
    });

    it('should initialize with custom valid values', () => {
      const pagination = new ClassicPage(25, 3);
      expect(pagination.limit).toBe(25);
      expect(pagination.page).toBe(3);
      expect(pagination.offset).toBe(50);
    });

    it('should sanitize invalid limit and page values to defaults', () => {
      const pagination = new ClassicPage(-5, 0);
      expect(pagination.limit).toBe(10);
      expect(pagination.page).toBe(1);
    });
  });

  describe('setTotal', () => {
    it('should correctly set and get total', () => {
      const pagination = new ClassicPage();
      pagination.setTotal(100);
      expect(pagination.total).toBe(100);
    });

    it('should sanitize negative total to zero', () => {
      const pagination = new ClassicPage();
      pagination.setTotal(-10);
      expect(pagination.total).toBe(0);
    });
  });

  describe('totalPages calculation', () => {
    it('should return 0 when total is undefined', () => {
      const pagination = new ClassicPage();
      expect(pagination.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', () => {
      const pagination = new ClassicPage(10, 1);

      pagination.setTotal(0);
      expect(pagination.totalPages).toBe(0);

      pagination.setTotal(5);
      expect(pagination.totalPages).toBe(1);

      pagination.setTotal(10);
      expect(pagination.totalPages).toBe(1);

      pagination.setTotal(11);
      expect(pagination.totalPages).toBe(2);

      pagination.setTotal(25);
      expect(pagination.totalPages).toBe(3);
    });
  });

  describe('hasNext and hasPrevious', () => {
    it('should handle navigation flags when total is undefined', () => {
      const pagination = new ClassicPage(10, 1);
      expect(pagination.hasNext).toBe(false);
      expect(pagination.hasPrevious).toBe(false);
    });

    it('should calculate flags correctly at first page', () => {
      const pagination = new ClassicPage(10, 1);
      pagination.setTotal(25); // 3 pages total

      expect(pagination.hasNext).toBe(true);
      expect(pagination.hasPrevious).toBe(false);
    });

    it('should calculate flags correctly at middle page', () => {
      const pagination = new ClassicPage(10, 2);
      pagination.setTotal(25);

      expect(pagination.hasNext).toBe(true);
      expect(pagination.hasPrevious).toBe(true);
    });

    it('should calculate flags correctly at last page', () => {
      const pagination = new ClassicPage(10, 3);
      pagination.setTotal(25);

      expect(pagination.hasNext).toBe(false);
      expect(pagination.hasPrevious).toBe(true);
    });

    it('should calculate flags correctly when out of bounds', () => {
      const pagination = new ClassicPage(10, 4);
      pagination.setTotal(25);

      expect(pagination.hasNext).toBe(false);
      expect(pagination.hasPrevious).toBe(true);
    });
  });

  describe('next and previous numeric values', () => {
    it('should return undefined when page has no next/previous options', () => {
      const pagination = new ClassicPage(10, 1);
      expect(pagination.next).toBeUndefined();
      expect(pagination.previous).toBeUndefined();
    });

    it('should return correct numeric next and previous values', () => {
      const pagination = new ClassicPage(10, 2);
      pagination.setTotal(30);

      expect(pagination.next).toBe(3);
      expect(pagination.previous).toBe(1);
    });

    it('should return undefined for next at the last page', () => {
      const pagination = new ClassicPage(10, 3);
      pagination.setTotal(30);

      expect(pagination.next).toBeUndefined();
      expect(pagination.previous).toBe(2);
    });
  });
});
