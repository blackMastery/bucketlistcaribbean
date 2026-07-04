"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingMessage } from "@/lib/account-queries";
import { sendAdminBookingMessage } from "@/app/account/actions";

export function BookingMessagesPanel({
  bookingId,
  userId,
  messages: initial,
}: {
  bookingId: string;
  userId: string;
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
      const res = await sendAdminBookingMessage({ bookingId, userId, body });
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(res.error ?? "Could not send message.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-ink/[0.06] bg-white p-5">
      <h3 className="m-0 mb-3 font-sans text-[15px] font-semibold text-ink">
        Concierge messages
      </h3>
      {initial.length === 0 ? (
        <p className="m-0 mb-3 text-[13px] text-muted">No messages yet.</p>
      ) : (
        <div className="mb-3 flex max-h-[240px] flex-col gap-2 overflow-y-auto">
          {initial.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-[13px] ${
                m.sender_role === "admin"
                  ? "ml-4 bg-green/[0.08] text-ink"
                  : "mr-4 bg-cream text-ink-soft"
              }`}
            >
              <span className="font-semibold capitalize">{m.sender_role}: </span>
              {m.body}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={send} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Reply to traveler…"
          className="resize-none rounded-lg border border-ink/15 px-3 py-2 font-body text-[13px] outline-none focus:border-green"
        />
        {error && <p className="m-0 text-[12px] text-coral">{error}</p>}
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="self-start rounded-lg bg-green px-4 py-2 font-sans text-[13px] font-semibold text-white disabled:opacity-60"
        >
          Send reply
        </button>
      </form>
    </div>
  );
}
