"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimBookingByReference } from "@/app/account/actions";

export function ClaimBookingForm() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    startTransition(async () => {
      const res = await claimBookingByReference(reference);
      if (res.ok) {
        setSuccess("Booking linked to your account.");
        setReference("");
        router.refresh();
      } else {
        setError(res.error ?? "Could not link booking.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 p-6">
      <h3 className="m-0 mb-1 font-sans text-[15px] font-semibold text-ink">
        Missing a booking?
      </h3>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Enter the reference from your confirmation email. It must match the email on
        your account.
      </p>
      <form onSubmit={submit} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="MC-A7F3B2"
          className="min-w-[200px] flex-1 rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green px-5 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Linking…" : "Link booking"}
        </button>
      </form>
      {error && (
        <p className="m-0 mt-3 text-[13px] text-coral" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="m-0 mt-3 text-[13px] text-green">{success}</p>
      )}
    </div>
  );
}
