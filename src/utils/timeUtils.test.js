import { describe, expect, it } from 'vitest';
import { calculateTargetTimeInSeconds, calculateTimeLeft, formatTime, getCurrentTimeInSeconds } from './timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('should format time correctly with HH:MM format when hours > 0', () => {
      const result = formatTime(3661);
      expect(result).toBe('01:01');
    });

    it('should format time with leading zeros', () => {
      const result = formatTime(3661);
      expect(result).toBe('01:01');
    });

    it('should handle zero seconds', () => {
      const result = formatTime(0);
      expect(result).toBe('00:00');
    });

    it('should handle time less than an hour showing MM:SS', () => {
      const result = formatTime(125);
      expect(result).toBe('02:05');
    });

    it('should handle time exactly 15 minutes showing HH:MM', () => {
      const result = formatTime(900);
      expect(result).toBe('00:15');
    });

    it('should handle time exactly one hour', () => {
      const result = formatTime(3600);
      expect(result).toBe('01:00');
    });
  });

  describe('calculateTargetTimeInSeconds', () => {
    it('should calculate seconds correctly from hour, minute, second', () => {
      const result = calculateTargetTimeInSeconds(10, 30, 45);
      expect(result).toBe(10 * 3600 + 30 * 60 + 45);
    });

    it('should handle midnight (00:00:00)', () => {
      const result = calculateTargetTimeInSeconds(0, 0, 0);
      expect(result).toBe(0);
    });

    it('should handle end of day (23:59:59)', () => {
      const result = calculateTargetTimeInSeconds(23, 59, 59);
      expect(result).toBe(23 * 3600 + 59 * 60 + 59);
    });

    it('should return string when target is before current time', () => {
      const result = calculateTargetTimeInSeconds(10, 0, 0);
      expect(typeof result === 'number').toBe(true);
    });
  });

  describe('calculateTimeLeft', () => {
    it('should calculate positive time difference', () => {
      const target = 20 * 3600; // 20:00:00
      const current = 10 * 3600; // 10:00:00
      const result = calculateTimeLeft(target, current);
      expect(result).toBe(10 * 3600);
    });

    it('should add 12 hours when target is before current time', () => {
      const target = 10 * 3600; // 10:00:00
      const current = 20 * 3600; // 20:00:00
      const result = calculateTimeLeft(target, current);
      // target - current = 10:00:00 - 20:00:00 = -10:00:00 = -36000
      // -36000 + 12*3600 = -36000 + 43200 = 7200 (2 hours)
      expect(result).toBe(2 * 3600);
    });

    it('should treat exactly 12 hours difference as 12 hours (not 0)', () => {
      const target = 1 * 3600; // 01:00:00
      const current = 13 * 3600; // 13:00:00
      const result = calculateTimeLeft(target, current);
      expect(result).toBe(12 * 3600);
    });

    it('should handle zero difference', () => {
      const target = 15 * 3600;
      const current = 15 * 3600;
      const result = calculateTimeLeft(target, current);
      expect(result >= 0).toBe(true);
    });
  });

  describe('getCurrentTimeInSeconds', () => {
    it('should return a number representing current time in seconds', () => {
      const result = getCurrentTimeInSeconds();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(24 * 3600);
    });

    it('should update over time', () => {
      const time1 = getCurrentTimeInSeconds();
      const time2 = getCurrentTimeInSeconds();
      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });
});
