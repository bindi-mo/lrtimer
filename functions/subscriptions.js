export async function onRequest({ env }) {
  try {
    let subscriptions = [];
    if (env.SUBSCRIPTIONS) {
      const keys = await env.SUBSCRIPTIONS.list();
      for (const key of keys.keys) {
        const value = await env.SUBSCRIPTIONS.get(key.name);
        if (value) subscriptions.push(JSON.parse(value));
      }
    } else {
      const { readFile } = await import('fs/promises');
      try {
        const data = await readFile('./data/subscriptions.json', 'utf8');
        subscriptions = JSON.parse(data);
      } catch (e) {
        // ignore
      }
    }

    return new Response(JSON.stringify(subscriptions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Subscriptions error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
