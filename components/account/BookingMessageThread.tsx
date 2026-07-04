"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingMessage } from "@/lib/account-queries";
import { sendBookingMessage } from "@/app/account/actions";

export function BookingMessageThread({
  bookingId,
  messages: initial,
}: {
  bookingId: string;
  messages: BookingMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await sendBookingMessage({ bookingId, body });
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(res.error ?? "Could not send message.");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <h3 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
        Concierge messages
      </h3>

      {initial.length === 0 ? (
        <p className="m-0 mb-4 text-[14px] text-muted">
          No messages yet. Ask your concierge a question about this trip.
        </p>
      ) : (
        <div className="mb-4 flex max-h-[320px] flex-col gap-3 overflow-y-auto">
          {initial.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-4 py-3 text-[14px] leading-[1.55] ${
                m.sender_role === "user"
                  ? "ml-auto bg-green/[0.1] text-ink"
                  : "mr-auto bg-cream text-ink-soft"
              }`}
            >
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">
                {m.sender_role === "user" ? "You" : "Concierge"}
              </div>
              {m.body}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={send} className="flex flex-col gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Ask about your itinerary, changes, or special requests…"
          className="resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green"
        />
        {error && (
          <p className="m-0 text-[13px] text-coral" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="self-start rounded-lg bg-green px-5 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
