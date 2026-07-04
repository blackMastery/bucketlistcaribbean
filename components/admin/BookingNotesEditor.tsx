"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnPrimary } from "@/components/admin/ui";
import { updateBookingNotes } from "@/app/admin/actions";

export function BookingNotesEditor({
  id,
  initialNotes,
}: {
  id: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={4}
        className={`${inputCls} min-h-[100px] resize-y`}
        placeholder="Internal notes for your team…"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          className={btnPrimary}
          disabled={pending}
          onClick={() => {
            start(async () => {
              await updateBookingNotes(id, notes);
              setSaved(true);
              router.refresh();
            });
          }}
        >
          {pending ? "Saving…" : "Save notes"}
        </button>
        {saved && (
          <span className="text-[13px] text-green">Saved</span>
        )}
      </div>
    </div>
  );
}
