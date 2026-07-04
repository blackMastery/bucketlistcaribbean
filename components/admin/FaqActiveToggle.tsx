"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleFaqActive } from "@/app/admin/chatbot/actions";

export function FaqActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink transition-colors hover:border-green hover:text-green disabled:opacity-60"
      onClick={() =>
        start(async () => {
          await toggleFaqActive(id, !isActive);
          router.refresh();
        })
      }
    >
      {pending ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
