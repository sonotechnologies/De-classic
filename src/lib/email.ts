import "server-only";
import { Resend } from "resend";
import { siteUrl } from "./seo";

type Mail = { to: string[]; subject: string; text: string; html: string };

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs, so local development needs no email account. */
export async function sendMail(mail: Mail): Promise<{ sent: boolean; error?: string }> {
  const to = [...new Set(mail.to.map((t) => t.trim()).filter(Boolean))];
  if (!to.length) return { sent: false, error: "No recipient" };
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] To ${to.join(", ")} · ${mail.subject}\n${mail.text}`);
    return { sent: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "De Classic Hotel <onboarding@resend.dev>",
      to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    if (error) {
      console.error("[email] Resend error", error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] failed", e);
    return { sent: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export function newRequestEmail(args: {
  to: string[];
  reservationId: string;
  reference: string;
  rows: [string, string][];
  requests: string | null;
}): Mail {
  const link = `${siteUrl()}/admin/reservations/${args.reservationId}`;
  const room = args.rows.find(([k]) => k === "Room")?.[1] ?? "";
  const dates = args.rows.find(([k]) => k === "Dates" || k === "Short stay")?.[1] ?? "";
  const subject = `New request ${args.reference} · ${room}, ${dates}`;
  const text = [
    `New reservation request ${args.reference}`,
    "",
    ...args.rows.map(([k, v]) => `${k}: ${v}`),
    args.requests ? `\nGuest note: ${args.requests}` : "",
    "",
    `Open it in the admin: ${link}`,
    "Call or WhatsApp the guest, then set the status to Confirmed or Declined.",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#111111;max-width:520px">
  <p style="font-size:13px;color:#0B5C5C;font-weight:600;margin:0 0 4px">new request</p>
  <p style="font-size:32px;font-weight:800;letter-spacing:-0.04em;margin:0 0 16px">${esc(args.reference.toLowerCase())}</p>
  <table style="border-collapse:collapse;width:100%;font-size:15px">${args.rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #D5E5E5;color:#5B6B6B">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #D5E5E5;font-weight:600;text-align:right">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
  ${args.requests ? `<p style="font-size:15px;background:#E8F9F9;border-radius:12px;padding:12px 14px">${esc(args.requests)}</p>` : ""}
  <p><a href="${esc(link)}" style="display:inline-block;background:#111111;color:#FFFFFF;border-radius:999px;padding:12px 22px;text-decoration:none;font-weight:600">Open in admin</a></p>
  <p style="font-size:13px;color:#5B6B6B">Call or WhatsApp the guest, then set the status to Confirmed or Declined.</p>
</div>`;
  return { to: args.to, subject, text, html };
}

export function staffInviteEmail(args: { to: string; name: string; tempPassword: string; role: string }): Mail {
  const link = `${siteUrl()}/admin/login`;
  const text = `Hi ${args.name},\n\nYou now have a ${args.role} account on the De Classic Hotel admin.\n\nSign in: ${link}\nEmail: ${args.to}\nTemporary password: ${args.tempPassword}\n\nYou'll be asked to choose your own password when you first sign in.`;
  const html = `<div style="font-family:Arial,sans-serif;color:#111111;max-width:520px"><p>Hi ${esc(args.name)},</p><p>You now have a <b>${esc(args.role)}</b> account on the De Classic Hotel admin.</p><p>Email: ${esc(args.to)}<br>Temporary password: <code style="background:#E8F9F9;padding:2px 6px;border-radius:6px">${esc(args.tempPassword)}</code></p><p><a href="${esc(link)}" style="display:inline-block;background:#111111;color:#FFFFFF;border-radius:999px;padding:12px 22px;text-decoration:none;font-weight:600">Sign in</a></p><p style="font-size:13px;color:#5B6B6B">You'll be asked to choose your own password when you first sign in.</p></div>`;
  return { to: [args.to], subject: "Your De Classic admin account", text, html };
}
