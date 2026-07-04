"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const tabCls = (active: boolean) =>
  `rounded-lg px-3.5 py-2 font-sans text-[13px] font-semibold no-underline transition-colors ${
    active
      ? "bg-green text-white"
      : "bg-white text-ink border border-ink/15 hover:border-green hover:text-green"
  }`;

export function ChatbotTabs({
  counts,
}: {
  counts: { faqs: number; conversations: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "conversations" ? "conversations" : "faqs";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function apply(nextTab: string, nextQuery?: string) {
    const params = new URLSearchParams();
    if (nextTab !== "faqs") params.set("tab", nextTab);
    const q = (nextQuery ?? query).trim();
    if (nextTab === "conversations" && q) params.set("q", q);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/chatbot?${qs}` : "/admin/chatbot");
    });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabCls(tab === "faqs")} onClick={() => apply("faqs")}>
          FAQs ({counts.faqs})
        </button>
        <button
          type="button"
          className={tabCls(tab === "conversations")}
          onClick={() => apply("conversations")}
        >
          Conversations ({counts.conversations})
        </button>
      </div>
      {tab === "conversations" && (
        <form
          className="ml-auto flex min-w-[220px] flex-1 gap-2 max-[640px]:ml-0 max-[640px]:w-full"
          onSubmit={(e) => {
            e.preventDefault();
            apply(tab);
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search session, message, reply…"
            className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 font-body text-[14px] text-ink outline-none focus:border-green"
          />
          <button
            type="submit"
            className="rounded-lg border border-ink/15 bg-white px-4 py-2 font-sans text-[13px] font-semibold text-ink hover:border-green hover:text-green"
          >
            Search
          </button>
        </form>
      )}
    </div>
  );
}
