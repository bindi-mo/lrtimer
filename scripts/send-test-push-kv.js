import webpush from 'web-push';

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';
const BASE = process.env.BASE_ORIGIN || 'http://127.0.0.1:4174';

if (!PUBLIC || !PRIVATE) {
  console.error('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars');
  process.exit(1);
}

webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);

async function run() {
  const res = await fetch(`${BASE}/api/subscriptions`);
  const body = await res.json();
  if (!body.ok) {
    console.error('Failed to fetch subscriptions', body);
    process.exit(1);
  }
  for (const s of body.items) {
    try {
      const payload = JSON.stringify({ title: 'LR Timer (test)', body: 'テスト通知です' });
      await webpush.sendNotification(s.value.subscription, payload);
      console.log('Sent to', s.id);
    } catch (e) {
      console.error('Failed send to', s.id, e);
      // Auto-delete stale subscriptions (HTTP 410 Gone)
      const status = e && e.statusCode;
      if (status === 410) {
        console.log('Deleting stale subscription', s.id);
        try {
          await fetch(`${BASE}/api/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: s.value.subscription.endpoint }),
          });
          console.log('Deleted', s.id);
        } catch (err) {
          console.error('Failed to delete subscription', s.id, err);
        }
      }
    }
  }
}

run().catch((e) => console.error(e));
