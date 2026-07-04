"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { btnDanger } from "@/components/admin/ui";

type ConfirmButtonProps = {
  children?: React.ReactNode;
  title?: string;
  confirmText?: string;
  className?: string;
  disabled?: boolean;
} & (
  | { action: () => Promise<unknown>; onConfirm?: never }
  | { onConfirm: () => void | Promise<void>; action?: never }
);

export function ConfirmButton({
  action,
  onConfirm,
  children = "Delete",
  title = "Are you sure?",
  confirmText = "This action cannot be undone.",
  className = btnDanger,
  disabled = false,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirmLabel = typeof children === "string" ? children : "Delete";
  const run = action ?? onConfirm;

  function handleConfirm() {
    startTransition(async () => {
      try {
        await run();
        setOpen(false);
      } catch {
        // Keep the dialog open if the action fails.
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        className={className}
        onClick={() => setOpen(true)}
      >
        {pending ? "…" : children}
      </button>

      <ConfirmDialog
        open={open}
        title={title}
        message={confirmText}
        confirmLabel={confirmLabel}
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
