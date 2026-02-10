export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const payloadStr = formData.get('payload');
    if (!payloadStr) {
      return new Response('Missing payload', { status: 400 });
    }

    const payload = JSON.parse(payloadStr);
    console.log('Received subscription:', payload);

    // Save to KV or file
    if (env.SUBSCRIPTIONS) {
      // KV storage
      await env.SUBSCRIPTIONS.put(payload.subscription.endpoint, JSON.stringify(payload));
    } else {
      // File storage for dev
      const { writeFile, readFile } = await import('fs/promises');
      const path = await import('path');
      const subscriptionsPath = path.resolve('./data/subscriptions.json');
      let subscriptions = [];
      try {
        const data = await readFile(subscriptionsPath, 'utf8');
        subscriptions = JSON.parse(data);
      } catch (e) {
        // ignore
      }
      subscriptions.push(payload);
      await writeFile(subscriptionsPath, JSON.stringify(subscriptions, null, 2));
    }

    return new Response('Subscribed', { status: 200 });
  } catch (error) {
    console.error('Subscribe error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
