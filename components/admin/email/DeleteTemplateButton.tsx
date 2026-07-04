"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { btnDanger } from "@/components/admin/ui";
import { deleteTemplate } from "@/app/admin/email-templates/actions";

export function DeleteTemplateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTemplate(id);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Could not delete template.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={btnDanger}
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete template?"
        message={`"${name}" will be permanently removed.`}
        confirmLabel="Delete"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
      {error && (
        <span className="text-[12px] text-coral">{error}</span>
      )}
    </>
  );
}
