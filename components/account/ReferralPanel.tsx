"use client";

import { useState } from "react";

export function ReferralPanel({
  referralCode,
  count,
}: {
  referralCode: string;
  count: number;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/signup?ref=${referralCode}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <h2 className="m-0 mb-2 font-serif text-[26px] font-semibold text-ink">
        Refer a friend
      </h2>
      <p className="m-0 mb-6 max-w-[520px] text-[15px] leading-[1.65] text-muted">
        Share Mista with friends who love to travel. When they create an account
        using your link, we&apos;ll track the referral on your account.
      </p>

      <div className="mb-6 rounded-xl bg-cream p-5">
        <div className="mb-1 text-[12px] font-semibold uppercase tracking-[1px] text-muted">
          Your referral link
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <code className="break-all font-mono text-[14px] text-ink">{shareUrl}</code>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-lg bg-green px-4 py-2 font-sans text-[13px] font-semibold text-white"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      <div className="inline-flex items-center gap-3 rounded-xl border border-green/25 bg-green/[0.06] px-5 py-4">
        <span className="font-serif text-[32px] font-bold text-green">{count}</span>
        <span className="text-[14px] text-ink-soft">
          friend{count === 1 ? "" : "s"} joined via your link
        </span>
      </div>
    </div>
  );
}
