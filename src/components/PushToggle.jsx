import { useEffect, useState } from 'react';
import { getPushSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/push';

export default function PushToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let mounted = true;
    getPushSubscription().then((s) => {
      if (mounted) setSubscribed(Boolean(s));
    });
    return () => { mounted = false; };
  }, []);

  const handleSubscribe = async () => {
    console.log('handleSubscribe called');
    if (!vapidKey) {
      console.error('VAPID public key is not configured');
      alert('VAPID public key is not configured (set VITE_VAPID_PUBLIC_KEY)');
      return;
    }
    console.log('VAPID key found:', vapidKey);
    setLoading(true);
    try {
      // Request notification permission first
      console.log('Requesting notification permission');
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        console.log('Permission result:', permission);
        if (permission !== 'granted') {
          alert('通知が許可されていません。ブラウザの通知許可を有効にしてください。');
          setLoading(false);
          return;
        }
      }

      console.log('Subscribing to push');
      const subscription = await subscribeToPush(vapidKey);
      console.log('Subscription obtained:', subscription);
      // Build schedule metadata from localStorage so server knows which target times to send
      let target = { hour: '19', minute: '00', second: '00' };
      try {
        const stored = localStorage.getItem('lrtimer_target_time');
        if (stored) target = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
      const enabledMap = (() => { try { return JSON.parse(localStorage.getItem('lrtimer_enabled_map') || '{}'); } catch (e) { return {}; } })();

      // Build two schedules (base and +12h)
      const t1Sec = (Number(target.hour) * 3600) + (Number(target.minute) * 60) + Number(target.second);
      const t2Hour = (Number(target.hour) + 12) % 24;
      const t2Sec = (t2Hour * 3600) + (Number(target.minute) * 60) + Number(target.second);
      const schedules = [
        { seconds: t1Sec, enabled: Boolean(enabledMap[String(t1Sec)] ?? true) },
        { seconds: t2Sec, enabled: Boolean(enabledMap[String(t2Sec)] ?? true) },
      ];

      const payload = {
        subscription,
        schedules,
        timezoneOffset: new Date().getTimezoneOffset(),
      };

      // Send subscription + schedules to server
      const bodyForm = new URLSearchParams();
      bodyForm.set('payload', JSON.stringify(payload));
      console.log('Sending to /api/subscribe:', payload);
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        body: bodyForm,
      });
      console.log('Response status:', res.status);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Failed to save subscription', res.status, text);
        alert('購読情報の保存に失敗しました（サーバーエラー）。コンソールを確認してください。');
        setLoading(false);
        return;
      }
      console.log('Subscription saved successfully');
      setSubscribed(true);
    } catch (err) {
      console.error('Subscription failed', err);
      alert('購読に失敗しました。コンソールを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      // Retrieve subscription details before unsubscribing so we can inform server
      const reg = await navigator.serviceWorker.ready;
      const currentSub = await reg.pushManager.getSubscription();
      const endpoint = currentSub?.endpoint;
      const success = await unsubscribeFromPush();
      if (success) {
        const bodyForm = new URLSearchParams();
        bodyForm.set('payload', JSON.stringify({ endpoint }));
        await fetch('/api/unsubscribe', {
          method: 'POST',
          body: bodyForm,
        });
        setSubscribed(false);
      } else {
        alert('購読解除に失敗しました。');
      }
    } catch (err) {
      console.error('Unsubscribe failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-toggle" style={{display: 'inline-flex', gap: 8}}>
      {subscribed ? (
        <button onClick={handleUnsubscribe} disabled={loading} aria-pressed="true">🔕 Push 無効化</button>
      ) : (
        <button onClick={handleSubscribe} disabled={loading} aria-pressed="false">🔔 Push 有効化</button>
      )}
    </div>
  );
}