import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerProvider } from '../contexts/TimerContext';
import { calculateTargetTimeInSeconds } from '../utils/timeUtils';
import Timer from './Timer';

describe('Timer component - edit mode based on localStorage', () => {
  beforeEach(() => {
    // Ensure a clean localStorage for each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('does NOT show edit mode on startup when a target time exists in localStorage', () => {
    localStorage.setItem('lrtimer_target_time', JSON.stringify({ hour: '19', minute: '00', second: '00' }));

    render(
      <TimerProvider>
        <Timer />
      </TimerProvider>
    );

    // The alarm select (visible in edit mode) should NOT be present
    expect(screen.queryByLabelText('アラーム音の種類を選択')).toBeNull();

    // The display-mode "時刻を設定" (or similar) button should be visible
    expect(screen.getByRole('button', { name: /時刻を?設定/ })).toBeInTheDocument();
  });

  it('shows edit mode on startup when no target time exists in localStorage', () => {
    // Ensure no stored target time
    localStorage.removeItem('lrtimer_target_time');

    render(
      <TimerProvider>
        <Timer />
      </TimerProvider>
    );

    // The alarm select should be visible in edit mode
    expect(screen.getByLabelText('アラーム音の種類を選択')).toBeInTheDocument();

    // The close button for the modal should be visible
    expect(screen.getByRole('button', { name: /閉じる/ })).toBeInTheDocument();
  });

  it('loads stored time closest to current time (chooses hour or hour+12)', async () => {
    // Stub Date so "now" is 2026-02-14 19:59:30 without enabling fake timers
    const RealDate = Date;
    const mockNow = new RealDate(2026, 1, 14, 19, 59, 30);
    vi.stubGlobal('Date', class extends Date {
      constructor(...args) {
        if (args.length === 0) return new RealDate(mockNow);
        return new RealDate(...args);
      }
      static now() { return mockNow.getTime(); }
    });

    // Stored base target is 08:00:00 — the +12h candidate (20:00:00) is closer to 19:59:30
    localStorage.setItem('lrtimer_target_time', JSON.stringify({ hour: '08', minute: '00', second: '00' }));

    render(
      <TimerProvider>
        <Timer />
      </TimerProvider>
    );

    // Open edit mode to inspect the selected hour value
    const editBtn = screen.getByRole('button', { name: /時刻を?設定/ });
    act(() => { fireEvent.click(editBtn); });

    const hourSelect = await screen.findByLabelText('時間');

    // Expect the component to have chosen the nearer occurrence (20:00)
    expect(hourSelect.value).toBe('20');

    vi.restoreAllMocks();
  });

  it('enables new schedule entries when changing target time so countdown can start', async () => {
    localStorage.setItem('lrtimer_target_time', JSON.stringify({ hour: '08', minute: '00', second: '00' }));

    // disable both existing schedules
    const s1 = calculateTargetTimeInSeconds('08', '00', '00');
    const s2hour = String(((8 + 12) % 24)).padStart(2, '0');
    const s2 = calculateTargetTimeInSeconds(s2hour, '00', '00');
    localStorage.setItem('lrtimer_enabled_map', JSON.stringify({ [String(s1)]: false, [String(s2)]: false }));

    render(
      <TimerProvider>
        <Timer />
      </TimerProvider>
    );

    // Open edit mode
    const editBtn = screen.getByRole('button', { name: /時刻を?設定/ });
    act(() => { fireEvent.click(editBtn); });

    // Wait for the edit controls to appear and change hour to 09
    const hourSelect = await screen.findByLabelText('時間');
    act(() => { fireEvent.change(hourSelect, { target: { value: '09' } }); });

    // Close modal
    const closeBtn = await screen.findByRole('button', { name: /閉じる/ });
    act(() => { fireEvent.click(closeBtn); });

    // Read enabled map from localStorage
    const enabled = JSON.parse(localStorage.getItem('lrtimer_enabled_map'));
    const newS1 = calculateTargetTimeInSeconds('09', '00', '00');
    const newS2 = calculateTargetTimeInSeconds(String(((9 + 12) % 24)).padStart(2, '0'), '00', '00');
    expect(enabled[String(newS1)]).toBe(true);
    expect(enabled[String(newS2)]).toBe(true);
  });

  it('ボタン押下で有効/無効がトグルされ、activeSchedule が再評価される', async () => {
    // 現在時刻を 07:00 に固定 -> ターゲット 08:00 が最も近い
    const RealDate = Date;
    const mockNow = new RealDate(2026, 1, 14, 7, 0, 0);
    vi.stubGlobal('Date', class extends Date {
      constructor(...args) {
        if (args.length === 0) return new RealDate(mockNow);
        return new RealDate(...args);
      }
      static now() { return mockNow.getTime(); }
    });

    localStorage.setItem('lrtimer_target_time', JSON.stringify({ hour: '08', minute: '00', second: '00' }));

    render(
      <TimerProvider>
        <Timer />
      </TimerProvider>
    );

    // ボタン要素（08:00 と 20:00）を取得
    const btn08 = screen.getByRole('button', { name: /08:00:00 の有効\/無効切替/ });
    const btn20 = screen.getByRole('button', { name: /20:00:00 の有効\/無効切替/ });

    // 初期は 08:00 がアクティブ
    await waitFor(() => expect(btn08.getAttribute('aria-current') || btn08.classList.contains('active')).toBeTruthy());

    // 08:00 を無効化（トグル） -> aria-pressed が false になり、activeSchedule は 20:00 に切替
    act(() => { fireEvent.click(btn08); });
    await waitFor(() => expect(btn08.getAttribute('aria-pressed')).toBe('false'));
    await waitFor(() => expect(screen.getByRole('button', { name: /20:00:00 の有効\/無効切替/ }).getAttribute('aria-current') || screen.getByRole('button', { name: /20:00:00 の有効\/無効切替/ }).classList.contains('active')).toBeTruthy());

    // localStorage の enabled_map が更新されている
    const s08 = calculateTargetTimeInSeconds('08', '00', '00');
    const enabled = JSON.parse(localStorage.getItem('lrtimer_enabled_map'));
    expect(enabled[String(s08)]).toBe(false);

    // 08:00 を再度クリック（有効化）して元に戻る
    act(() => { fireEvent.click(btn08); });
    await waitFor(() => expect(btn08.getAttribute('aria-pressed')).toBe('true'));
    await waitFor(() => expect(btn08.getAttribute('aria-current') || btn08.classList.contains('active')).toBeTruthy());

    vi.restoreAllMocks();
  });
});
