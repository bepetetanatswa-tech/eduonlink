import { createSign } from "crypto";

// Firebase Cloud Messaging HTTP v1 sender, implemented directly against
// Google's REST APIs (no firebase-admin dependency) — signs a short-lived
// OAuth2 JWT with the service account's private key, exchanges it for an
// access token, then POSTs to the FCM v1 send endpoint per device token.
// Requires FCM_SERVICE_ACCOUNT_JSON (the full service account JSON, as one
// env var) — see android app self-audit notes for how to obtain it. Skips
// silently (like the existing VAPID web-push path) when not configured.

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedAccount: ServiceAccount | null | undefined;

function getServiceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) { cachedAccount = null; return null; }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) { cachedAccount = null; return null; }
    cachedAccount = parsed;
  } catch {
    cachedAccount = null;
  }
  return cachedAccount ?? null;
}

export function fcmReady(): boolean {
  return getServiceAccount() !== null;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  const signature = base64url(signer.sign(account.private_key));
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`FCM token exchange failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

/** Returns the FCM tokens that came back "unregistered" — caller should delete those rows. */
export async function sendFcm(tokens: string[], payload: { title: string; body: string; link: string }): Promise<{ sent: number; invalid: string[] }> {
  const account = getServiceAccount();
  if (!account || tokens.length === 0) return { sent: 0, invalid: [] };

  const accessToken = await getAccessToken(account);
  let sent = 0;
  const invalid: string[] = [];

  await Promise.all(tokens.map(async (token) => {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: { link: payload.link },
            android: { priority: "high" },
          },
        }),
      });
      if (res.ok) { sent++; return; }
      const errBody = await res.json().catch(() => null);
      const status = errBody?.error?.status;
      if (status === "NOT_FOUND" || status === "UNREGISTERED" || status === "INVALID_ARGUMENT") invalid.push(token);
      else console.error("[fcm send] failed:", status ?? res.status);
    } catch (err) {
      console.error("[fcm send] request error:", err instanceof Error ? err.message : err);
    }
  }));

  return { sent, invalid };
}
