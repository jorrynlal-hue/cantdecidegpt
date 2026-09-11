// PayPal Orders v2 server helper — create order → user approves → capture.
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET    = process.env.PAYPAL_CLIENT_SECRET;
const BASE      = process.env.PAYPAL_API_BASE ?? 'https://api-m.paypal.com';

export function paypalConfigured(): boolean {
  return Boolean(CLIENT_ID && SECRET);
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  if (!CLIENT_ID || !SECRET) throw new Error('PayPal env vars are not set.');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('PayPal token error: ' + (await res.text()));
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 10_000 };
  return tokenCache.token;
}

export async function createOrder(amount: string, description: string, planId: string): Promise<{ id: string; approveLink: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: amount }, description: `${description} (${planId})` }],
      application_context: {
        brand_name: "Can't Decide GPT",
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/plans?paypal=success`,
        cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/plans?paypal=cancelled`,
      },
    }),
  });
  if (!res.ok) throw new Error('PayPal create-order error: ' + (await res.text()));
  const data = await res.json() as { id: string; links: Array<{ rel: string; href: string }> };
  const approve = data.links.find((l) => l.rel === 'payer-action' || l.rel === 'approve')?.href ?? '';
  return { id: data.id, approveLink: approve };
}

export async function captureOrder(orderId: string): Promise<{ captureId: string; status: string; payerId?: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('PayPal capture error: ' + (await res.text()));
  const data = await res.json();
  const status = data.status as string;
  const payerId = data.payer?.payer_id as string | undefined;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return { captureId: capture?.id ?? orderId, status, payerId };
}

// Verify a PayPal webhook signature (POST /v1/notifications/webhooks-event).
export async function verifyWebhook(headers: Record<string, unknown>, body: string, webhookId?: string): Promise<{ verified: boolean; event?: Record<string, unknown> }> {
  if (!webhookId) return { verified: true }; // if no webhook id configured, trust the request
  const token = await getAccessToken();
  const transmissionId = headers['paypal-transmission-id'] as string ?? '';
  const transmissionSig = headers['paypal-transmission-sig'] as string ?? '';
  const transmissionTime = headers['paypal-transmission-time'] as string ?? '';
  const certUrl = headers['paypal-cert-url'] as string ?? '';
  const authAlgo = headers['paypal-auth-algo'] as string ?? '';

  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });
  if (!res.ok) return { verified: false };
  const data = await res.json() as { verification_status: string; resource?: Record<string, unknown> };
  return { verified: data.verification_status === 'SUCCESS', event: data.resource };
}