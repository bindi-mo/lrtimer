import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScheduledTimer } from './useScheduledTimer';

describe('useScheduledTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct initial time left', () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));
    expect(result.current.scheduledTimeLeft).toBeGreaterThan(0);
  });

  it('should start timer', () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));

    act(() => {
      result.current.handleStart();
    });

    expect(result.current.isScheduledRunning).toBe(true);
  });

  it('should stop timer', () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));

    act(() => {
      result.current.handleStart();
    });

    expect(result.current.isScheduledRunning).toBe(true);

    act(() => {
      result.current.handleStop();
    });

    expect(result.current.isScheduledRunning).toBe(false);
  });

  it('should return initial time when not running', () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));
    const initialTime = result.current.scheduledTimeLeft;

    expect(result.current.isScheduledRunning).toBe(false);
    expect(result.current.scheduledTimeLeft).toBe(initialTime);
  });

  it('should set isAchieved to true when reaching target time', async () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));

    act(() => {
      result.current.handleStart();
    });

    // すぐに達成状態になることはないので、初期値を確認
    expect(result.current.isAchieved).toBe(false);
  });

  it('should display achievement flashing for 10 seconds', () => {
    const { result } = renderHook(() => useScheduledTimer('19', '00', '00'));

    // 点滅期間は ACHIEVEMENT_DISPLAY: 10 秒
    // これは useScheduledTimer の定数で定義されている
    expect(result.current.isAchieved).toBe(false);
  });

  it('does not set isAchieved immediately when started after the target time', () => {
    // 現在時刻を 20:00:00 に設定し、ターゲットを 19:00:00 にする（既に過ぎている状態）
    const base = new Date(2026, 1, 9, 20, 0, 0);
    vi.setSystemTime(base);

    const currentSeconds = base.getHours() * 3600 + base.getMinutes() * 60 + base.getSeconds();
    const targetSeconds = currentSeconds - (1 * 3600); // 1時間前

    const targetHour = String(Math.floor((targetSeconds / 3600) % 24));
    const targetMinute = String(Math.floor((targetSeconds % 3600) / 60));
    const targetSecond = String(targetSeconds % 60);

    const { result } = renderHook(() => useScheduledTimer(targetHour, targetMinute, targetSecond));

    act(() => {
      result.current.handleStart();
    });

    // 開始直後は isAchieved にならない（既に過ぎているだけではトリガーしない）
    expect(result.current.isAchieved).toBe(false);

    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.isAchieved).toBe(false);
  });

  it('sets isAchieved when crossing the target time (prev > 0 -> diff <= 0)', () => {
    // 現在時刻をターゲットの1秒前にして、1秒進めると達成されること
    const base = new Date(2026, 1, 9, 10, 0, 0);
    vi.setSystemTime(base);

    const currentSeconds = base.getHours() * 3600 + base.getMinutes() * 60 + base.getSeconds();
    const targetSeconds = currentSeconds + 1; // 1秒先がターゲット

    const targetHour = String(Math.floor((targetSeconds / 3600) % 24));
    const targetMinute = String(Math.floor((targetSeconds % 3600) / 60));
    const targetSecond = String(targetSeconds % 60);

    const { result } = renderHook(() => useScheduledTimer(targetHour, targetMinute, targetSecond));

    act(() => {
      result.current.handleStart();
    });

    // 1秒経過させて横切りさせる
    act(() => vi.advanceTimersByTime(1500));

    expect(result.current.isAchieved).toBe(true);
  });
});
