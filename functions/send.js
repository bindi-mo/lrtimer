export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { subscription, payload } = await request.json();
    if (!subscription) {
      return new Response('Missing subscription', { status: 400 });
    }

    const vapidKeys = {
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };

    const webpush = await import('web-push');
    webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:test@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return new Response('Sent', { status: 200 });
  } catch (error) {
    console.error('Send error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
