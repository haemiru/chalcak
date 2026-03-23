// Server-only — Web Push helper
import webpush from "web-push";

let _configured = false;

function ensureConfigured() {
  if (_configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
  }
  webpush.setVapidDetails("mailto:hello@chalcak.ai", publicKey, privateKey);
  _configured = true;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();
  return webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}
