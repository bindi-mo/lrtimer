// Cloudflare Worker Scheduled script (Cron Trigger)
// Scans subscriptions in KV (binding: SUBSCRIPTIONS) and triggers /api/send for matches

export default {
  async scheduled(event, env, ctx) {
    const now = new Date();

    // helper: local time adjusted by timezoneOffset (in minutes)
    const getLocalSeconds = (tzOffsetMinutes) => {
      // tzOffset = minutes to add to local to get UTC. So local = UTC - tzOffset
      const localMs = Date.now() - (tzOffsetMinutes * 60 * 1000);
      const ld = new Date(localMs);
      return ld.getHours() * 3600 + ld.getMinutes() * 60 + ld.getSeconds();
    };

    const FIFTEEN = 15 * 60;
    const FIVE = 5 * 60;

    // iterate KV list
    let cursor = undefined;
    do {
      const res = await env.SUBSCRIPTIONS.list({ cursor });
      for (const key of res.keys) {
        try {
          const raw = await env.SUBSCRIPTIONS.get(key.name);
          if (!raw) continue;
          const obj = JSON.parse(raw);
          const tzOffset = obj.timezoneOffset || 0;
          const nowLocalSec = getLocalSeconds(tzOffset);

          for (const s of (obj.schedules || [])) {
            const scheduleSec = Number(s.seconds);
            if (Number.isNaN(scheduleSec)) continue;
            let delta = scheduleSec - nowLocalSec;
            if (delta <= 0) delta += 24 * 3600;

            const today = new Date(Date.now() - (tzOffset * 60 * 1000)).toISOString().slice(0, 10);
            obj.lastSent = obj.lastSent || {};
            obj.lastSent[String(scheduleSec)] = obj.lastSent[String(scheduleSec)] || {};

            if (delta === FIFTEEN && obj.lastSent[String(scheduleSec)].fifteen !== today) {
              // trigger 15-min push
              await fetch(`${env.BASE_ORIGIN || 'https://your-domain.example'}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: obj.subscription, payload: { title: 'LR Timer', body: '15分前です' } }),
              }).catch((e) => console.error('send fetch err', e));

              obj.lastSent[String(scheduleSec)].fifteen = today;
              await env.SUBSCRIPTIONS.put(key.name, JSON.stringify(obj));
            }

            if (delta === FIVE && obj.lastSent[String(scheduleSec)].five !== today) {
              // trigger 5-min push
              await fetch(`${env.BASE_ORIGIN || 'https://your-domain.example'}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: obj.subscription, payload: { title: 'LR Timer', body: '5分前です' } }),
              }).catch((e) => console.error('send fetch err', e));

              obj.lastSent[String(scheduleSec)].five = today;
              await env.SUBSCRIPTIONS.put(key.name, JSON.stringify(obj));
            }
          }
        } catch (e) {
          console.error('Failed processing key', key.name, e);
        }
      }
      cursor = res.cursor;
    } while (cursor);
  }
};
