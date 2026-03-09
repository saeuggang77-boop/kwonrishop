import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log("[Email] Skipped (no API key):", { to, subject });
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "권리샵 <noreply@kwonrishop.com>",
      to,
      subject,
      html,
    });
    console.log("[Email] Sent:", { to, subject });
  } catch (error) {
    console.error("[Email] Failed:", error);
  }
}
