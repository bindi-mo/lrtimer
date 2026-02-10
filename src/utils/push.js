// Utilities for Web Push subscription (client-side)
// Uses VAPID public key from `import.meta.env.VITE_VAPID_PUBLIC_KEY`

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported');
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  return subscription;
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return false;
  const success = await existing.unsubscribe();
  return success;
}