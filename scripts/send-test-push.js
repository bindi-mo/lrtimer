// Local test script: read data/subscriptions.json and send test pushes using web-push
import fs from 'fs/promises';
import webpush from 'web-push';

const PUBLIC = process.env.VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:you@example.com';

if (!PUBLIC || !PRIVATE) {
  console.error('Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars');
  process.exit(1);
}

webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);

async function run() {
  const path = new URL('../data/subscriptions.json', import.meta.url);
  const raw = await fs.readFile(path, 'utf8');
  let arr = JSON.parse(raw || '[]');
  const next = [];
  for (const r of arr) {
    try {
      const payload = JSON.stringify({ title: 'LR Timer (test)', body: 'テスト通知です' });
      await webpush.sendNotification(r.subscription, payload);
      console.log('Sent to', r.id);
      next.push(r);
    } catch (e) {
      console.error('Failed send to', r.id, e);
      const status = e && e.statusCode;
      if (status === 410) {
        // drop this subscription
        console.log('Removing stale subscription', r.id);
      } else {
        next.push(r);
      }
    }
  }
  // Persist filtered list
  await fs.writeFile(path, JSON.stringify(next, null, 2), 'utf8');
}

run().catch((e) => console.error(e));
