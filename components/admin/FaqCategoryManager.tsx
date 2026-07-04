"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inputCls, btnGhost } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { createFaqCategory, deleteFaqCategory } from "@/app/admin/chatbot/actions";
import type { FaqCategory } from "@/lib/database.types";

export function FaqCategoryManager({ categories }: { categories: FaqCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const nextSortOrder =
    categories.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createFaqCategory(name, nextSortOrder);
      if (!r.ok) {
        setError(r.error ?? "Error");
        return;
      }
      setName("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <p className="m-0 text-[13px] text-muted">No categories yet.</p>
        )}
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-ink/[0.08] bg-white px-3.5 py-2"
          >
            <span className="font-sans text-[14px] text-ink">{c.name}</span>
            <ConfirmButton
              title="Delete category?"
              confirmText={`FAQs in “${c.name}” will become uncategorized (they are not deleted).`}
              className="font-sans text-[12.5px] font-semibold text-coral hover:underline"
              onConfirm={async () => {
                const r = await deleteFaqCategory(c.id);
                if (r.ok) router.refresh();
              }}
            >
              Remove
            </ConfirmButton>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
        />
        <button type="submit" className={`${btnGhost} shrink-0`} disabled={pending || !name.trim()}>
          {pending ? "Adding…" : "Add"}
        </button>
      </form>
      {error && <p className="m-0 mt-2 text-[13px] text-coral">{error}</p>}
    </div>
  );
}
