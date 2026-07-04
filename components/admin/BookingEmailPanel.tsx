"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resendBookingEmail } from "@/app/admin/actions";
import { btnPrimary, Card, FormLabel, inputCls } from "@/components/admin/ui";

const RESEND_TEMPLATES = [
  { slug: "booking_confirmation", label: "Booking confirmation" },
  { slug: "booking_confirmed", label: "Booking confirmed" },
  { slug: "booking_cancelled", label: "Booking cancelled" },
] as const;

export function BookingEmailPanel({
  bookingId,
  contactEmail,
  templatesActive,
}: {
  bookingId: string;
  contactEmail: string | null;
  templatesActive: Record<string, boolean>;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>(RESEND_TEMPLATES[0].slug);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const disabled = !contactEmail || !templatesActive[slug];

  function handleResend() {
    setMessage(null);
    startTransition(async () => {
      const result = await resendBookingEmail(bookingId, slug);
      setMessage(result.message ?? (result.ok ? "Email sent." : result.error ?? "Failed."));
      if (result.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif text-[18px] font-semibold text-ink">
        Resend email
      </h2>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Send a transactional email to the guest using the saved template.
      </p>

      {!contactEmail && (
        <p className="m-0 mb-4 text-[13px] text-coral">No contact email on this booking.</p>
      )}

      <div className="mb-4">
        <FormLabel htmlFor="resend-template">Template</FormLabel>
        <select
          id="resend-template"
          className={inputCls}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={!contactEmail}
        >
          {RESEND_TEMPLATES.map((t) => (
            <option key={t.slug} value={t.slug} disabled={!templatesActive[t.slug]}>
              {t.label}
              {!templatesActive[t.slug] ? " (inactive)" : ""}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className={`m-0 mb-4 text-[13px] ${message.includes("sent") || message.includes("recorded") ? "text-green" : "text-coral"}`}>
          {message}
        </p>
      )}

      <button
        type="button"
        className={btnPrimary}
        disabled={disabled || pending}
        onClick={handleResend}
      >
        {pending ? "Sending…" : "Resend email"}
      </button>
    </Card>
  );
}
