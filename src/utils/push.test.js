import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPushSubscription, subscribeToPush, unsubscribeFromPush, urlBase64ToUint8Array } from './push.js';

describe('push.js', () => {
  let mockServiceWorker;
  let mockPushManager;
  let mockRegistration;
  let originalServiceWorker;

  beforeAll(() => {
    originalServiceWorker = global.navigator.serviceWorker;
  });

  beforeEach(() => {
    mockPushManager = {
      getSubscription: vi.fn(),
      subscribe: vi.fn(),
    };
    mockRegistration = {
      pushManager: mockPushManager,
    };
    mockServiceWorker = {
      ready: vi.fn().mockResolvedValue(mockRegistration),
    };
    global.navigator = { ...global.navigator, serviceWorker: mockServiceWorker };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.navigator = { ...global.navigator, serviceWorker: originalServiceWorker };
  });

  describe('urlBase64ToUint8Array', () => {
    it('should convert a valid base64 string to Uint8Array', () => {
      const base64 = 'SGVsbG8gV29ybGQ'; // 'Hello World' in base64
      const result = urlBase64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(11);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]);
    });

    it('should handle base64 with padding', () => {
      const base64 = 'SGVsbG8'; // 'Hello' in base64, needs padding
      const result = urlBase64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle base64 with URL-safe characters', () => {
      const base64 = 'SGVsbG8_V29ybGQ-'; // Modified with _ and -
      const result = urlBase64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      // This will decode to something else, but ensure no errors
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getPushSubscription', () => {
    it('should return the subscription when service workers are supported', async () => {
      const mockSubscription = { endpoint: 'https://example.com' };
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

      const result = await getPushSubscription();
      expect(result).toBe(mockSubscription);
      expect(mockServiceWorker.ready).toHaveBeenCalled();
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
    });

    it('should return null when service workers are not supported', async () => {
      global.navigator = { ...global.navigator, serviceWorker: undefined };

      const result = await getPushSubscription();
      expect(result).toBeNull();
    });
  });

  describe('subscribeToPush', () => {
    const vapidKey = 'test-vapid-key';

    it('should return existing subscription if one exists', async () => {
      const mockSubscription = { endpoint: 'https://example.com' };
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

      const result = await subscribeToPush(vapidKey);
      expect(result).toBe(mockSubscription);
      expect(mockPushManager.subscribe).not.toHaveBeenCalled();
    });

    it('should create a new subscription if none exists', async () => {
      const mockSubscription = { endpoint: 'https://new.com' };
      mockPushManager.getSubscription.mockResolvedValue(null);
      mockPushManager.subscribe.mockResolvedValue(mockSubscription);

      const result = await subscribeToPush(vapidKey);
      expect(result).toBe(mockSubscription);
      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    });

    it('should throw an error when service workers are not supported', async () => {
      global.navigator = { ...global.navigator, serviceWorker: undefined };

      await expect(subscribeToPush(vapidKey)).rejects.toThrow('Service workers are not supported');
    });
  });

  describe('unsubscribeFromPush', () => {
    it('should unsubscribe and return true if subscription exists', async () => {
      const mockSubscription = { unsubscribe: vi.fn().mockResolvedValue(true) };
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

      const result = await unsubscribeFromPush();
      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should return false if no subscription exists', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);

      const result = await unsubscribeFromPush();
      expect(result).toBe(false);
    });

    it('should return false when service workers are not supported', async () => {
      global.navigator = { ...global.navigator, serviceWorker: undefined };

      const result = await unsubscribeFromPush();
      expect(result).toBe(false);
    });
  });
});