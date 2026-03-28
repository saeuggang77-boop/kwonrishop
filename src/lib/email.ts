import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping:", subject);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "권리샵 <noreply@kwonrishop.com>",
      to,
      subject,
      html,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("[Email] Sent:", subject);
    }
  } catch (error) {
    console.error("[Email] Failed:", error);
  }
}
