#!/usr/bin/env node

// Script to generate VAPID keys for web push notifications
import webpush from 'web-push';

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID keys generated successfully:');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
} catch (error) {
  console.error('Error generating VAPID keys:', error.message);
  process.exit(1);
}