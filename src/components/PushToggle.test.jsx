// Mock the push utilities
vi.mock('../utils/push', () => ({
  getPushSubscription: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPushSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/push';
import PushToggle from './PushToggle';

// Mock fetch
global.fetch = vi.fn();

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn(),
  },
});

// Mock navigator.serviceWorker
const mockPushManager = {
  getSubscription: vi.fn().mockResolvedValue({ endpoint: 'test-endpoint' }),
};
const mockServiceWorkerContainer = {
  ready: Promise.resolve({
    pushManager: mockPushManager,
  }),
};
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: mockServiceWorkerContainer,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PushToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks
    subscribeToPush.mockResolvedValue({ endpoint: 'test-endpoint' });
    unsubscribeFromPush.mockResolvedValue(true);
    global.fetch.mockResolvedValue({ ok: true });
    window.Notification.permission = 'default';
    window.Notification.requestPermission.mockResolvedValue('granted');
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'lrtimer_target_time') return JSON.stringify({ hour: '19', minute: '00', second: '00' });
      if (key === 'lrtimer_enabled_map') return '{}';
      return null;
    });
    // Mock import.meta.env
    import.meta.env.VITE_VAPID_PUBLIC_KEY = 'BNvTDy03CkgjAGCDv_OUev98K8ctF1v4fMRJGi9SnKRjeA4GULjpz_kJfEfhLrY34oUwfBjb0C_slMAiQcn7pSg';
    window.__VAPID_KEY__ = 'BNvTDy03CkgjAGCDv_OUev98K8ctF1v4fMRJGi9SnKRjeA4GULjpz_kJfEfhLrY34oUwfBjb0C_slMAiQcn7pSg';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__VAPID_KEY__;
    import.meta.env.VITE_VAPID_PUBLIC_KEY = 'BNvTDy03CkgjAGCDv_OUev98K8ctF1v4fMRJGi9SnKRjeA4GULjpz_kJfEfhLrY34oUwfBjb0C_slMAiQcn7pSg';
  });

  it('should render subscribe button when not subscribed', async () => {
    getPushSubscription.mockResolvedValue(null);
    render(<PushToggle />);
    await waitFor(() => {
      expect(screen.getByText('🔔 Push 有効化')).toBeInTheDocument();
    });
  });

  it('should render unsubscribe button when subscribed', async () => {
    getPushSubscription.mockResolvedValue({ endpoint: 'test-endpoint' });
    render(<PushToggle />);
    await waitFor(() => {
      expect(screen.getByText('🔕 Push 無効化')).toBeInTheDocument();
    });
  });

  it('should handle subscribe with notification permission denied', async () => {
    getPushSubscription.mockResolvedValue(null);
    window.Notification.requestPermission.mockResolvedValue('denied');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PushToggle />);
    const button = await screen.findByText('🔔 Push 有効化');
    fireEvent.click(button);
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('通知が許可されていません。ブラウザの通知許可を有効にしてください。');
    });
    alertMock.mockRestore();
  });

  it('should handle successful subscribe', async () => {
    getPushSubscription.mockResolvedValue(null);
    render(<PushToggle />);
    const button = await screen.findByText('🔔 Push 有効化');
    fireEvent.click(button);
    await waitFor(() => {
      expect(subscribeToPush).toHaveBeenCalledWith('BNvTDy03CkgjAGCDv_OUev98K8ctF1v4fMRJGi9SnKRjeA4GULjpz_kJfEfhLrY34oUwfBjb0C_slMAiQcn7pSg');
      expect(global.fetch).toHaveBeenCalledWith('/api/subscribe', {
        method: 'POST',
        body: expect.any(URLSearchParams),
      });
      expect(screen.getByText('🔕 Push 無効化')).toBeInTheDocument();
    });
  });

  it('should handle subscribe failure', async () => {
    getPushSubscription.mockResolvedValue(null);
    global.fetch.mockResolvedValue({ ok: false, text: () => Promise.resolve('Server error') });
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PushToggle />);
    const button = await screen.findByText('🔔 Push 有効化');
    fireEvent.click(button);
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('購読情報の保存に失敗しました（サーバーエラー）。コンソールを確認してください。');
    });
    alertMock.mockRestore();
  });

  it('should handle unsubscribe successfully', async () => {
    getPushSubscription.mockResolvedValue({ endpoint: 'test-endpoint' });
    render(<PushToggle />);
    const button = await screen.findByText('🔕 Push 無効化');
    fireEvent.click(button);
    await waitFor(() => {
      expect(unsubscribeFromPush).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/unsubscribe', {
        method: 'POST',
        body: expect.any(URLSearchParams),
      });
      expect(screen.getByText('🔔 Push 有効化')).toBeInTheDocument();
    });
  });

  it('should handle unsubscribe failure', async () => {
    getPushSubscription.mockResolvedValue({ endpoint: 'test-endpoint' });
    unsubscribeFromPush.mockResolvedValue(false);
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PushToggle />);
    const button = await screen.findByText('🔕 Push 無効化');
    fireEvent.click(button);
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('購読解除に失敗しました。');
    });
    alertMock.mockRestore();
  });

  it('should show loading state during subscribe', async () => {
    getPushSubscription.mockResolvedValue(null);
    subscribeToPush.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ endpoint: 'test' }), 100)));
    render(<PushToggle />);
    const button = await screen.findByText('🔔 Push 有効化');
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled(), { timeout: 2000 });
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('should show loading state during unsubscribe', async () => {
    getPushSubscription.mockResolvedValue({ endpoint: 'test-endpoint' });
    unsubscribeFromPush.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    render(<PushToggle />);
    const button = await screen.findByText('🔕 Push 無効化');
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled(), { timeout: 2000 });
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 2000 });
  });
});