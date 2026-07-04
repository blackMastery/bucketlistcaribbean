import "server-only";

import { Resend } from "resend";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { buildSampleVars } from "@/lib/email/variables";
import { renderTemplate } from "@/lib/email/render";
import { formatPrice } from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import {
  buildBookingEmailContext,
  getEmailBrand,
  getTemplateBySlug,
} from "@/lib/email/context";

export { buildTrackUrl, buildAdminBookingUrl } from "@/lib/email/urls";

type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
  templateSlug?: string;
  bookingId?: string;
  sentBy?: string;
};

type SendResult = {
  status: "sent" | "failed" | "logged";
  message: string;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string | null {
  return (
    process.env.BOOKING_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    null
  );
}

function replyToAddress(): string | undefined {
  const v = process.env.EMAIL_REPLY_TO?.trim();
  return v || undefined;
}

function adminAddress(): string | null {
  return process.env.BOOKING_ADMIN_EMAIL?.trim() || null;
}

async function insertEmailLog(row: {
  template_slug?: string;
  to_email: string;
  subject: string;
  status: "sent" | "failed" | "logged";
  provider_id?: string | null;
  error?: string | null;
  booking_id?: string | null;
  created_by?: string | null;
}): Promise<void> {
  if (!hasServiceRole) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("email_log").insert(row);
  } catch (err) {
    console.error("[email] Failed to write email_log:", err);
  }
}

export async function sendEmail(opts: SendEmailOpts): Promise<SendResult> {
  const to = opts.to?.trim();
  if (!to || !isValidEmail(to)) {
    await insertEmailLog({
      template_slug: opts.templateSlug,
      to_email: to || "(invalid)",
      subject: opts.subject,
      status: "failed",
      error: "Invalid recipient email",
      booking_id: opts.bookingId ?? null,
      created_by: opts.sentBy ?? null,
    });
    return { status: "failed", message: "Invalid recipient email." };
  }

  if (!hasServiceRole) {
    console.warn("[email] Skipping send — SUPABASE_SERVICE_ROLE_KEY not set");
    return { status: "logged", message: "Email service unavailable (no service role key)." };
  }

  const resend = getResend();
  const from = fromAddress();

  if (!resend) {
    console.warn("[email] Log-only mode — RESEND_API_KEY not set");
    await insertEmailLog({
      template_slug: opts.templateSlug,
      to_email: to,
      subject: opts.subject,
      status: "logged",
      booking_id: opts.bookingId ?? null,
      created_by: opts.sentBy ?? null,
    });
    return {
      status: "logged",
      message: "Email recorded (log-only mode — not delivered).",
    };
  }

  if (!from) {
    await insertEmailLog({
      template_slug: opts.templateSlug,
      to_email: to,
      subject: opts.subject,
      status: "failed",
      error: "Missing sender address",
      booking_id: opts.bookingId ?? null,
      created_by: opts.sentBy ?? null,
    });
    return { status: "failed", message: "Missing sender address (BOOKING_FROM_EMAIL)." };
  }

  const replyTo = replyToAddress();
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: opts.subject,
    html: opts.html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });

  if (error) {
    console.error("[email] Send failed:", error);
    await insertEmailLog({
      template_slug: opts.templateSlug,
      to_email: to,
      subject: opts.subject,
      status: "failed",
      error: error.message,
      booking_id: opts.bookingId ?? null,
      created_by: opts.sentBy ?? null,
    });
    return { status: "failed", message: error.message };
  }

  await insertEmailLog({
    template_slug: opts.templateSlug,
    to_email: to,
    subject: opts.subject,
    status: "sent",
    provider_id: data?.id ?? null,
    booking_id: opts.bookingId ?? null,
    created_by: opts.sentBy ?? null,
  });
  return { status: "sent", message: "Email sent successfully." };
}

type SendBookingEmailOpts = {
  bookingId?: string;
  referenceCode?: string;
  slug: string;
  sentBy?: string;
};

export async function sendBookingEmail(
  opts: SendBookingEmailOpts,
): Promise<SendResult> {
  const template = await getTemplateBySlug(opts.slug);
  if (!template || !template.is_active) {
    return { status: "logged", message: "Template missing or inactive." };
  }

  const ctx = await buildBookingEmailContext({
    bookingId: opts.bookingId,
    referenceCode: opts.referenceCode,
  });
  if (!ctx) {
    return { status: "logged", message: "Booking context unavailable." };
  }

  const { subject, html } = renderTemplate(template, ctx.vars, ctx.brand);
  return sendEmail({
    to: ctx.toEmail,
    subject,
    html,
    templateSlug: opts.slug,
    bookingId: ctx.bookingId,
    sentBy: opts.sentBy,
  });
}

export async function sendBookingAdminEmail(
  opts: SendBookingEmailOpts,
): Promise<SendResult> {
  const adminTo = adminAddress();
  if (!adminTo) return { status: "logged", message: "Admin email not configured." };

  const template = await getTemplateBySlug(opts.slug);
  if (!template || !template.is_active) {
    return { status: "logged", message: "Template missing or inactive." };
  }

  const ctx = await buildBookingEmailContext({
    bookingId: opts.bookingId,
    referenceCode: opts.referenceCode,
  });
  if (!ctx) {
    return { status: "logged", message: "Booking context unavailable." };
  }

  const { subject, html } = renderTemplate(template, ctx.vars, ctx.brand);
  return sendEmail({
    to: adminTo,
    subject,
    html,
    templateSlug: opts.slug,
    bookingId: ctx.bookingId,
    sentBy: opts.sentBy,
  });
}

export async function sendTestEmail(opts: {
  slug: string;
  to: string;
  sentBy?: string;
}): Promise<SendResult> {
  const template = await getTemplateBySlug(opts.slug);
  if (!template) {
    return { status: "failed", message: "Template not found." };
  }

  const brand = await getEmailBrand();
  const vars = buildSampleVars(formatPrice);
  const { subject, html } = renderTemplate(template, vars, brand);

  return sendEmail({
    to: opts.to,
    subject: `[TEST] ${subject}`,
    html,
    templateSlug: opts.slug,
    sentBy: opts.sentBy,
  });
}

export function getEmailDeliveryMode(): "live" | "log-only" | "disabled" {
  if (!hasServiceRole) return "disabled";
  if (!process.env.RESEND_API_KEY?.trim()) return "log-only";
  return "live";
}
