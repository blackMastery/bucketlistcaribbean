"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { submitReview } from "@/app/account/actions";

export function ReviewForm({
  tourId,
  bookingId,
}: {
  tourId: string;
  bookingId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitReview({ tourId, bookingId, rating, body });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error ?? "Could not submit review.");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/[0.06] p-6 text-center">
        <p className="m-0 font-sans text-[15px] font-semibold text-green">
          Thank you! Your review has been submitted and is pending moderation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <h3 className="m-0 mb-1 font-serif text-[20px] font-semibold text-ink">
        Share your experience
      </h3>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Help other travelers by leaving a review for this tour.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block font-sans text-[12.5px] font-semibold text-ink-soft">
            Rating
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} stars`}
                className="border-none bg-transparent p-0"
              >
                <Star
                  size={22}
                  className={n <= rating ? "text-gold" : "text-ink/20"}
                  fill={n <= rating ? "currentColor" : "none"}
                  strokeWidth={n <= rating ? 0 : 2}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block font-sans text-[12.5px] font-semibold text-ink-soft">
            Your review
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
            minLength={10}
            className="w-full resize-none rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green"
            placeholder="What made this journey memorable?"
          />
        </div>
        {error && (
          <p className="m-0 text-[13px] text-coral" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-lg bg-green px-5 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
