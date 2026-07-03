import { NextResponse, type NextRequest } from "next/server";
import { sendEmail, contactFormEmail } from "@/lib/email";
import { gibberishReason } from "@/lib/textQuality";

const CONTACT_INBOX = "vavhimiacademy@gmail.com";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { name, email, phone, subject, message, website } = body ?? {};

  // Honeypot: a real visitor never sees or fills this field (hidden via CSS
  // on the form) — a bot filling every field will trip it. Pretend success
  // so the bot doesn't learn to skip the field.
  if (typeof website === "string" && website.trim()) {
    return NextResponse.json({ ok: true });
  }

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, subject, and message are all required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const nameIssue = gibberishReason(name);
  if (nameIssue) return NextResponse.json({ error: `Name: ${nameIssue}` }, { status: 400 });

  if (message.trim().length < 10) {
    return NextResponse.json({ error: "Message is too short — please tell us a bit more." }, { status: 400 });
  }

  const result = await sendEmail({
    to: CONTACT_INBOX,
    subject: `[Educonnect Contact] ${subject.trim()}`,
    html: contactFormEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
    }),
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Could not send your message right now. Please try again shortly or email us directly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
