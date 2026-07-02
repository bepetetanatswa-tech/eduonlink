import { Resend } from "resend";

// Resend requires a verified sending domain for production delivery to
// arbitrary recipients. Until vavhimi.ac.zw (or another domain) is verified
// in the Resend dashboard, EMAIL_FROM should stay on Resend's shared test
// sender, which only delivers to the Resend account owner's own address —
// fine for now, but real school-admin/teacher emails need a verified domain.
const FROM = process.env.EMAIL_FROM || "VOA <onboarding@resend.dev>";

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
<body style="margin:0;padding:0;background:#07080C;font-family:-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <p style="color:#4D7FFF;font-weight:700;font-size:18px;letter-spacing:-0.02em;margin:0 0 24px;">VOA</p>
    <div style="background:#0E1117;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
      <h1 style="color:#CDD6F4;font-size:18px;margin:0 0 16px;">${title}</h1>
      <div style="color:#8892B0;font-size:14px;line-height:1.6;">${bodyHtml}</div>
    </div>
    <p style="color:#4A5170;font-size:11px;margin-top:20px;">Vavhimi Online Academy — Zimbabwe's Future Learns Here</p>
  </div>
</body>
</html>`;

export function schoolSubmittedEmail(schoolName: string) {
  return wrapper(
    "Registration received",
    `<p>Thanks for registering <strong style="color:#CDD6F4;">${schoolName}</strong> on VOA. Your application is now pending review by our team.</p><p>We'll email you as soon as a decision is made — this usually takes 1-2 business days.</p>`
  );
}

export function schoolApprovedEmail(schoolName: string, dashboardUrl: string) {
  return wrapper(
    "You're approved! 🎉",
    `<p><strong style="color:#00E5A3;">${schoolName}</strong> has been verified and your dashboard is now unlocked.</p><p><a href="${dashboardUrl}" style="color:#4D7FFF;">Go to your dashboard →</a></p>`
  );
}

export function schoolRejectedEmail(schoolName: string, reason: string) {
  return wrapper(
    "Registration update",
    `<p>We were unable to verify <strong style="color:#CDD6F4;">${schoolName}</strong> at this time.</p><p style="color:#FF6B6B;">Reason: ${reason}</p><p>You're welcome to update your details and resubmit.</p>`
  );
}

export function teacherInviteEmail(schoolName: string, inviteUrl: string) {
  return wrapper(
    `You're invited to teach at ${schoolName}`,
    `<p>${schoolName} has invited you to join VOA as a teacher.</p><p><a href="${inviteUrl}" style="color:#4D7FFF;">Accept invite & register →</a></p>`
  );
}
