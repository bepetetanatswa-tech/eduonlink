/* eslint-disable @typescript-eslint/no-explicit-any */
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (!vapidReady()) {
    return Response.json({ error: "Push not configured" }, { status: 503 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  const body = await req.json().catch(() => null);
  const userId: string | undefined = body?.user_id;
  if (!userId) return Response.json({ error: "user_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: subs } = await (admin.from("user_push_subscriptions") as any)
    .select("id, endpoint, p256dh, auth").eq("user_id", userId);

  if (!subs?.length) return Response.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({
    title: body.title || "EduOnLink",
    body: body.message || "",
    url: body.link || "/dashboard",
  });

  let sent = 0;
  await Promise.all(subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await (admin.from("user_push_subscriptions") as any).delete().eq("id", s.id);
      } else {
        console.error("[push send] failed:", err?.message ?? err);
      }
    }
  }));

  return Response.json({ ok: true, sent });
}
