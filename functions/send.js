export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get subscriptions
    let subscriptions = [];
    if (env.SUBSCRIPTIONS) {
      // KV
      const keys = await env.SUBSCRIPTIONS.list();
      for (const key of keys.keys) {
        const value = await env.SUBSCRIPTIONS.get(key.name);
        if (value) subscriptions.push(JSON.parse(value));
      }
    } else {
      // File
      const { readFile } = await import('fs/promises');
      try {
        const data = await readFile('./data/subscriptions.json', 'utf8');
        subscriptions = JSON.parse(data);
      } catch (e) {
        // ignore
      }
    }

    if (subscriptions.length === 0) {
      return new Response('Missing subscription', { status: 400 });
    }

    // Send push to first subscription for testing
    const sub = subscriptions[0];
    const vapidKeys = {
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };

    const webpush = await import('web-push');
    webpush.setVapidDetails('mailto:test@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

    await webpush.sendNotification(sub.subscription, 'Test notification');

    return new Response('Sent', { status: 200 });
  } catch (error) {
    console.error('Send error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
