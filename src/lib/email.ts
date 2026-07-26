import { Resend } from "resend";

// Resend requires a verified sending domain for production delivery to
// arbitrary recipients. Until vavhimi.ac.zw (or another domain) is verified
// in the Resend dashboard, EMAIL_FROM should stay on Resend's shared test
// sender, which only delivers to the Resend account owner's own address —
// fine for now, but real school-admin/teacher emails need a verified domain.
const FROM = process.env.EMAIL_FROM || "EduOnLink <onboarding@resend.dev>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — email not sent:", { to, subject });
    return { ok: false, error: "Email is not configured" };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

const wrapper = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F2EEE3;font-family:-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <p style="color:#B1502B;font-weight:700;font-size:18px;letter-spacing:-0.02em;margin:0 0 24px;">EduOnLink</p>
    <div style="background:#FFFFFF;border:1px solid #CCD0C0;border-radius:4px;padding:28px;">
      <h1 style="color:#1C2620;font-size:18px;margin:0 0 16px;">${title}</h1>
      <div style="color:#566257;font-size:14px;line-height:1.6;">${bodyHtml}</div>
    </div>
    <p style="color:#6E7A6C;font-size:11px;margin-top:20px;">EduOnLink — ZIMSEC learning for every Zimbabwean student</p>
  </div>
</body>
</html>`;

export function schoolSubmittedEmail(schoolName: string) {
  return wrapper(
    "Registration received",
    `<p>Thanks for registering <strong style="color:#1C2620;">${schoolName}</strong> on EduOnLink. Your application is now pending review by our team.</p><p>We'll email you as soon as a decision is made — this usually takes 1-2 business days.</p>`
  );
}

export function schoolApprovedEmail(schoolName: string, dashboardUrl: string) {
  return wrapper(
    "You're approved",
    `<p><strong style="color:#1F4738;">${schoolName}</strong> has been verified and your dashboard is now unlocked.</p><p><a href="${dashboardUrl}" style="color:#B1502B;">Go to your dashboard →</a></p>`
  );
}

export function schoolRejectedEmail(schoolName: string, reason: string) {
  return wrapper(
    "Registration update",
    `<p>We were unable to verify <strong style="color:#1C2620;">${schoolName}</strong> at this time.</p><p style="color:#A3311E;">Reason: ${reason}</p><p>You're welcome to update your details and resubmit.</p>`
  );
}

export function teacherInviteEmail(schoolName: string, inviteUrl: string) {
  return wrapper(
    `You're invited to teach at ${schoolName}`,
    `<p>${schoolName} has invited you to join EduOnLink as a teacher.</p><p><a href="${inviteUrl}" style="color:#B1502B;">Accept invite & register →</a></p>`
  );
}

export function teacherApplicationReceivedEmail() {
  return wrapper(
    "Application received",
    `<p>Thanks for submitting your ZTC number and documents for verification. Your account stays pending until our team reviews them — this usually takes 1-2 business days.</p><p>We'll email you as soon as a decision is made.</p>`
  );
}

export function teacherApprovedEmail(fullName: string) {
  return wrapper(
    "You're verified",
    `<p>Hi <strong style="color:#1C2620;">${fullName}</strong>, your teacher account has been verified. You now have full access to teaching features on EduOnLink.</p>`
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function contactFormEmail(input: { name: string; email: string; phone: string | null; subject: string; message: string }) {
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const phone = input.phone ? escapeHtml(input.phone) : null;
  const subject = escapeHtml(input.subject);
  const message = escapeHtml(input.message);
  return wrapper(
    `New contact form message: ${subject}`,
    `<p><strong style="color:#1C2620;">From:</strong> ${name} (${email})</p>
     ${phone ? `<p><strong style="color:#1C2620;">Phone:</strong> ${phone}</p>` : ""}
     <p style="margin-top:16px;white-space:pre-wrap;">${message}</p>`
  );
}

export function teacherRejectedEmail(fullName: string, reason: string) {
  return wrapper(
    "Application update",
    `<p>Hi <strong style="color:#1C2620;">${fullName}</strong>, we were unable to verify your teacher application at this time.</p><p style="color:#A3311E;">Reason: ${reason}</p><p>You're welcome to update your details and resubmit from your dashboard.</p>`
  );
}
