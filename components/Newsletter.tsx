"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { subscribeNewsletter } from "@/app/actions";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await subscribeNewsletter(email);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-gold/50 bg-sand/15 p-5 text-center font-sans font-medium text-sand">
        <Icon name="check" size={16} strokeWidth={2.5} />
        You&apos;re on the list. Welcome aboard!
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2.5 rounded-xl bg-white p-2 min-[481px]:flex-row"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="flex-1 border-none bg-transparent px-3.5 py-3 font-body text-[14px] text-ink outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full whitespace-nowrap rounded-lg bg-green px-[22px] py-3 font-sans text-[14px] font-semibold text-white transition-colors hover:bg-green-dark disabled:opacity-70 min-[481px]:w-auto"
      >
        {pending ? "…" : "Subscribe"}
      </button>
      {error && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
