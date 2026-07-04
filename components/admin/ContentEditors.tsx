"use client";

import { useState, useTransition } from "react";
import { inputCls, labelCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import {
  PaymentTermsForm,
  DEFAULT_PAYMENT_TERMS,
} from "@/components/admin/TourPricingFields";
import { updateSiteContent } from "@/app/admin/actions";
import type { Json, PaymentTerms } from "@/lib/database.types";

type Field = { name: string; label: string; textarea?: boolean };

function SaveBar({
  onSave,
  pending,
  saved,
}: {
  onSave: () => void;
  pending: boolean;
  saved: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button className={btnPrimary} disabled={pending} onClick={onSave}>
        {pending ? "Saving…" : "Save"}
      </button>
      {saved && <span className="text-[13px] text-green">Saved.</span>}
    </div>
  );
}

// Single object block, e.g. the promo banner.
export function ObjectBlockEditor({
  contentKey,
  fields,
  initial,
}: {
  contentKey: string;
  fields: Field[];
  initial: Record<string, string>;
}) {
  const [obj, setObj] = useState<Record<string, string>>(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
        {fields.map((f) => (
          <div key={f.name} className={f.textarea ? "col-span-2 max-[700px]:col-span-1" : ""}>
            <label className={labelCls}>{f.label}</label>
            <input
              className={inputCls}
              value={obj[f.name] ?? ""}
              onChange={(e) => {
                setSaved(false);
                setObj((s) => ({ ...s, [f.name]: e.target.value }));
              }}
            />
          </div>
        ))}
      </div>
      <SaveBar
        pending={pending}
        saved={saved}
        onSave={() =>
          start(async () => {
            await updateSiteContent(contentKey, obj as Json);
            setSaved(true);
          })
        }
      />
    </div>
  );
}

// Array-of-objects block, e.g. hero stats, pillars, values, certs.
export function ArrayBlockEditor({
  contentKey,
  fields,
  initial,
}: {
  contentKey: string;
  fields: Field[];
  initial: Record<string, string>[];
}) {
  const [rows, setRows] = useState<Record<string, string>[]>(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function update(i: number, name: string, value: string) {
    setSaved(false);
    setRows((s) => s.map((r, idx) => (idx === i ? { ...r, [name]: value } : r)));
  }
  function addRow() {
    setSaved(false);
    setRows((s) => [...s, Object.fromEntries(fields.map((f) => [f.name, ""]))]);
  }
  function removeRow(i: number) {
    setSaved(false);
    setRows((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-lg border border-ink/10 bg-cream/40 p-3.5">
            <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
              {fields.map((f) => (
                <div key={f.name} className={f.textarea ? "col-span-2 max-[700px]:col-span-1" : ""}>
                  <label className={labelCls}>{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      className={`${inputCls} min-h-[60px] resize-y`}
                      value={row[f.name] ?? ""}
                      onChange={(e) => update(i, f.name, e.target.value)}
                    />
                  ) : (
                    <input
                      className={inputCls}
                      value={row[f.name] ?? ""}
                      onChange={(e) => update(i, f.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2.5">
              <ConfirmButton
                title="Remove item?"
                confirmText="This content block will be removed. Save to apply the change."
                onConfirm={() => removeRow(i)}
              >
                Remove
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <button className={btnGhost} onClick={addRow}>+ Add item</button>
      </div>
      <SaveBar
        pending={pending}
        saved={saved}
        onSave={() =>
          start(async () => {
            await updateSiteContent(contentKey, rows as Json);
            setSaved(true);
          })
        }
      />
    </div>
  );
}

// Array-of-strings block, e.g. footer popular tours.
export function StringArrayEditor({
  contentKey,
  initial,
}: {
  contentKey: string;
  initial: string[];
}) {
  const [items, setItems] = useState<string[]>(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {items.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputCls}
              value={v}
              onChange={(e) => {
                setSaved(false);
                setItems((s) => s.map((x, idx) => (idx === i ? e.target.value : x)));
              }}
            />
            <ConfirmButton
              title="Remove item?"
              confirmText="This item will be removed from the list. Save to apply the change."
              onConfirm={() => {
                setSaved(false);
                setItems((s) => s.filter((_, idx) => idx !== i));
              }}
            >
              Remove
            </ConfirmButton>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <button className={btnGhost} onClick={() => { setSaved(false); setItems((s) => [...s, ""]); }}>
          + Add item
        </button>
      </div>
      <SaveBar
        pending={pending}
        saved={saved}
        onSave={() =>
          start(async () => {
            await updateSiteContent(contentKey, items.filter((x) => x.trim()) as Json);
            setSaved(true);
          })
        }
      />
    </div>
  );
}

// Global default payment terms (structured), saved to site_content "payment_terms".
export function PaymentTermsBlockEditor({
  initial,
}: {
  initial: PaymentTerms | null;
}) {
  const [terms, setTerms] = useState<PaymentTerms>(initial ?? DEFAULT_PAYMENT_TERMS);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PaymentTermsForm
        value={terms}
        onChange={(v) => {
          setSaved(false);
          setTerms(v);
        }}
      />
      <SaveBar
        pending={pending}
        saved={saved}
        onSave={() =>
          start(async () => {
            await updateSiteContent("payment_terms", terms as unknown as Json);
            setSaved(true);
          })
        }
      />
    </div>
  );
}
