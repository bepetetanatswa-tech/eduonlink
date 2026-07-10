/* eslint-disable @typescript-eslint/no-explicit-any */
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { fcmReady, sendFcm } from "@/lib/fcm/send";

function vapidReady() {
  return !!(process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

// Called by a Postgres trigger (see supabase/migrations/020_push_notifications.sql)
// on every INSERT into `notifications` — not by the client directly.
export async function POST(req: Request) {
  const secret = req.headers.get("x-push-secret");
  if (!secret || secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webPushOn = vapidReady();
  const fcmOn = fcmReady();
  if (!webPushOn && !fcmOn) {
    return Response.json({ error: "Push not configured" }, { status: 503 });
  }
  if (webPushOn) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  }

  const body = await req.json().catch(() => null);
  const userId: string | undefined = body?.user_id;
  if (!userId) return Response.json({ error: "user_id required" }, { status: 400 });

  const admin = createAdminClient();
  const title = body.title || "EduOnLink";
  const message = body.message || "";
  const link = body.link || "/dashboard";

  let sent = 0;

  if (webPushOn) {
    const { data: subs } = await (admin.from("user_push_subscriptions") as any)
      .select("id, endpoint, p256dh, auth").eq("user_id", userId);
    const payload = JSON.stringify({ title, body: message, url: link });
    await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await (admin.from("user_push_subscriptions") as any).delete().eq("id", s.id);
        } else {
          console.error("[push send] web push failed:", err?.message ?? err);
        }
      }
    }));
  }

  if (fcmOn) {
    const { data: devices } = await (admin.from("user_device_tokens") as any)
      .select("token").eq("user_id", userId);
    const tokens = (devices ?? []).map((d: { token: string }) => d.token);
    if (tokens.length) {
      const { sent: fcmSent, invalid } = await sendFcm(tokens, { title, body: message, link });
      sent += fcmSent;
      if (invalid.length) {
        await (admin.from("user_device_tokens") as any).delete().in("token", invalid);
      }
    }
  }

  return Response.json({ ok: true, sent });
}
