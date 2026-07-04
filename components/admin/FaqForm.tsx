"use client";

import { useState, useTransition } from "react";
import { inputCls, FormLabel, FormRequiredNote, btnPrimary } from "@/components/admin/ui";
import { createFaq, updateFaq, type FaqInput } from "@/app/admin/chatbot/actions";
import type { Faq } from "@/lib/database.types";

function Saved({ msg }: { msg: string | null }) {
  return msg ? <span className="text-[13px] text-green">{msg}</span> : null;
}

export function FaqForm({
  mode,
  faq,
  categories,
}: {
  mode: "new" | "edit";
  faq?: Faq;
  categories: { id: string; name: string }[];
}) {
  const [f, setF] = useState({
    question: faq?.question ?? "",
    answer: faq?.answer ?? "",
    keywords: faq?.keywords.join(", ") ?? "",
    category_id: faq?.category_id ?? "",
    is_active: faq?.is_active ?? true,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const input: FaqInput = {
      question: f.question.trim(),
      answer: f.answer.trim(),
      keywords: f.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      category_id: f.category_id || null,
      is_active: f.is_active,
    };
    start(async () => {
      if (mode === "new") await createFaq(input);
      else if (faq) {
        const r = await updateFaq(faq.id, input);
        setMsg(r.ok ? "Saved." : r.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FormRequiredNote />
      <div>
        <FormLabel required>Question</FormLabel>
        <input
          className={inputCls}
          value={f.question}
          onChange={(e) => set("question", e.target.value)}
          placeholder="How do I book a tour?"
          required
        />
      </div>
      <div>
        <FormLabel required>Answer</FormLabel>
        <textarea
          className={`${inputCls} min-h-[120px] resize-y`}
          value={f.answer}
          onChange={(e) => set("answer", e.target.value)}
          required
        />
        <p className="m-0 mt-1.5 text-[12.5px] text-muted-light">
          Shown to visitors word-for-word when this FAQ matches — write it customer-ready.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div>
          <FormLabel>Category</FormLabel>
          <select
            className={inputCls}
            value={f.category_id}
            onChange={(e) => set("category_id", e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>Keywords</FormLabel>
          <input
            className={inputCls}
            value={f.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            placeholder="cancel, cancellation, refund, reschedule"
          />
          <p className="m-0 mt-1.5 text-[12.5px] text-muted-light">
            Comma-separated. The words a customer would type — they weigh double
            when matching messages to this FAQ.
          </p>
        </div>
      </div>
      <label className="flex items-center gap-2.5 font-sans text-[14px] text-ink">
        <input
          type="checkbox"
          checked={f.is_active}
          onChange={(e) => set("is_active", e.target.checked)}
          className="h-4 w-4 accent-green"
        />
        Active — the chatbot can match and quote this FAQ
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Saving…" : mode === "new" ? "Create FAQ" : "Save changes"}
        </button>
        <Saved msg={msg} />
      </div>
    </form>
  );
}
