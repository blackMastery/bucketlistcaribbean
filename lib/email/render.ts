// Pure email rendering — safe to import in client components for preview.

import { isRawHtmlKey } from "@/lib/email/variables";

export type EmailBrand = {
  name: string;
  email: string;
  phone: string;
  address: string;
  url: string;
  whatsapp?: string;
};

export type EmailVars = Record<string, string>;

export type EmailTemplateInput = {
  subject: string;
  body_html: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function substitute(
  input: string,
  vars: EmailVars,
  opts: { html: boolean },
): string {
  return input.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key] ?? "";
    if (opts.html && !isRawHtmlKey(key)) {
      return escapeHtml(value);
    }
    return value;
  });
}

export function renderLayout(innerHtml: string, brand: EmailBrand): string {
  const footer = brand.email
    ? `Questions? Reply to this email or contact ${escapeHtml(brand.email)}.`
    : "Questions? Reply to this email.";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(brand.name)}</title></head>
<body style="margin:0;padding:0;background:#F7F3EA;font-family:Inter,Arial,sans-serif;color:#1A2E28;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#1B7A5C;padding:24px 28px;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#F7F3EA;">${escapeHtml(brand.name)}</div>
        </td></tr>
        <tr><td style="padding:28px;">${innerHtml}</td></tr>
        <tr><td style="padding:0 28px 28px;font-size:12px;color:#7A8A84;line-height:1.5;">
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderTemplate(
  template: EmailTemplateInput,
  vars: EmailVars,
  brand: EmailBrand,
): { subject: string; html: string } {
  const subject = substitute(template.subject, vars, { html: false });
  const body = substitute(template.body_html, vars, { html: true });
  const html = renderLayout(body, brand);
  return { subject, html };
}

type BookingDetailsInput = {
  tourTitle: string;
  travelDate: string | null;
  travelers: number;
  totalCents: number;
  depositCents?: number | null;
  referenceCode?: string;
  status?: string;
};

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#7A8A84;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#1A2E28;font-weight:600;">${escapeHtml(value)}</td>
  </tr>`;
}

export function buildBookingDetailsHtml(
  booking: BookingDetailsInput,
  formatPrice: (cents: number) => string,
  formatDate: (iso: string) => string,
): string {
  const rows = [
    detailRow("Tour", booking.tourTitle),
    booking.travelDate
      ? detailRow("Travel date", formatDate(booking.travelDate))
      : "",
    detailRow("Travelers", String(booking.travelers)),
    detailRow("Total", formatPrice(booking.totalCents)),
    booking.referenceCode
      ? detailRow("Reference", booking.referenceCode)
      : "",
    booking.status ? detailRow("Status", booking.status) : "",
    booking.depositCents && booking.depositCents > 0
      ? detailRow("Deposit", formatPrice(booking.depositCents))
      : "",
  ].join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${rows}</table>`;
}

export function buildSpecialRequestsHtml(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  return `<p style="margin:0 0 20px;font-size:14px;color:#3D524C;"><strong>Special requests:</strong> ${escapeHtml(text.trim())}</p>`;
}
