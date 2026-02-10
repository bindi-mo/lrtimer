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
    const endpoint = payload.endpoint;
    console.log('Unsubscribing:', endpoint);

    if (env.SUBSCRIPTIONS) {
      await env.SUBSCRIPTIONS.delete(endpoint);
    } else {
      const { readFile, writeFile } = await import('fs/promises');
      let subscriptions = [];
      try {
        const data = await readFile('./data/subscriptions.json', 'utf8');
        subscriptions = JSON.parse(data);
      } catch (e) {
        // ignore
      }
      subscriptions = subscriptions.filter(sub => sub.subscription.endpoint !== endpoint);
      await writeFile('./data/subscriptions.json', JSON.stringify(subscriptions, null, 2));
    }

    return new Response('Unsubscribed', { status: 200 });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
