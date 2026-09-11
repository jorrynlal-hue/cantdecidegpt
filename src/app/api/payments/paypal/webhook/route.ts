import { ok, fail } from '@/lib/core/api/helpers';
import { verifyWebhook } from '@/lib/core/paypal';

// PayPal calls this endpoint after subscription/payment events.
// Verify the signature if PAYPAL_WEBHOOK_ID is configured; otherwise 200 OK
// (PayPal retries rapidly if the endpoint fails).
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const headers: Record<string, unknown> = {};
    ['paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time', 'paypal-cert-url', 'paypal-auth-algo'].forEach((h) => {
      headers[h] = req.headers.get(h);
    });
    const { verified } = await verifyWebhook(headers, body, webhookId);
    if (!verified && webhookId) return fail('UNVERIFIED', 'Webhook signature could not be verified.', 401);
    // In a full system, queue the event for plan-activation or subscription renewal here.
    return ok({ received: true });
  } catch {
    return ok({ received: true }); // PayPal expects 200 even for errors
  }
}