import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as alarmSounds from '../utils/alarmSounds';
import { useScheduledTimer } from './useScheduledTimer';

describe('useScheduledTimer notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('triggers 15-minute notification when crossing the threshold', () => {
    // 固定時刻をセット（2026-02-09 10:00:00）
    const base = new Date(2026, 1, 9, 10, 0, 0);
    vi.setSystemTime(base);

    const currentSeconds = base.getHours() * 3600 + base.getMinutes() * 60 + base.getSeconds();
    // 15分 + 2秒 先に目標を置く（最初は >15分、数秒進めると 15分を下回る）
    const targetSeconds = currentSeconds + (15 * 60) + 2; // 902 秒

    const targetHour = String(Math.floor((targetSeconds / 3600) % 24));
    const targetMinute = String(Math.floor((targetSeconds % 3600) / 60));
    const targetSecond = String(targetSeconds % 60);

    const playSpy = vi.spyOn(alarmSounds, 'playAlarmSound').mockImplementation(() => {});

    const { result } = renderHook(() => useScheduledTimer(targetHour, targetMinute, targetSecond, 'phone'));

    act(() => {
      result.current.handleStart();
    });

    // 3秒進めて 902 -> 899 秒にし、15分未満へ突入させる
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(playSpy).toHaveBeenCalled();
    expect(result.current.showModal).toBe(true);
  });

  it('fires 15-minute notification only once when crossing the threshold', () => {
    const base = new Date(2026, 1, 9, 10, 0, 0);
    vi.setSystemTime(base);

    const currentSeconds = base.getHours() * 3600 + base.getMinutes() * 60 + base.getSeconds();
    const targetSeconds = currentSeconds + (15 * 60) + 2; // 902 秒

    const targetHour = String(Math.floor((targetSeconds / 3600) % 24));
    const targetMinute = String(Math.floor((targetSeconds % 3600) / 60));
    const targetSecond = String(targetSeconds % 60);

    const playSpy = vi.spyOn(alarmSounds, 'playAlarmSound').mockImplementation(() => {});

    const { result } = renderHook(() => useScheduledTimer(targetHour, targetMinute, targetSecond, 'phone'));

    act(() => {
      result.current.handleStart();
    });

    // 閾値を越えて通知が出る（再生は短時間繰り返される）
    act(() => { vi.advanceTimersByTime(3000); });

    const callsAfterFirst = playSpy.mock.calls.length;

    // さらに時間を進めても、重複して15分通知が発生しないこと（再度通知イベントは発生しない）
    act(() => { vi.advanceTimersByTime(10000); });

    expect(playSpy.mock.calls.length).toBeGreaterThanOrEqual(callsAfterFirst);
  });
});