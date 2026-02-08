import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerProvider } from '../contexts/TimerContext';
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
});
