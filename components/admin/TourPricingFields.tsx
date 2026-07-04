"use client";

import {
  inputCls,
  labelCls,
  cardCls,
  btnGhost,
} from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { formatPrice, formatDate } from "@/lib/format";
import type {
  TourPricing,
  PaymentTerms,
  OccupancyTier,
  ChildTier,
} from "@/lib/database.types";

// Whole GYD <-> integer cents (GYD × 100) at the input boundary.
const toGyd = (cents: number) => (cents ? String(Math.round(cents / 100)) : "");
const toCents = (s: string) => Math.round(Number(s || 0) * 100);

export const DEFAULT_CHILD_TIERS: ChildTier[] = [
  { key: "child_2_12", label: "Children 2–12", price_cents: 0 },
  { key: "child_under_2", label: "Children under 2", price_cents: 0 },
];

export const DEFAULT_OCCUPANCY_TIERS: OccupancyTier[] = [
  { occupants: 1, label: "Solo traveler — private room", price_cents: 0 },
  { occupants: 2, label: "2 persons / room", price_cents: 0 },
  { occupants: 3, label: "3 persons / room", price_cents: 0 },
  { occupants: 4, label: "4 persons / room", price_cents: 0 },
];

export const DEFAULT_PRICING: TourPricing = {
  occupancy: DEFAULT_OCCUPANCY_TIERS,
  children: DEFAULT_CHILD_TIERS,
};

export const DEFAULT_PAYMENT_TERMS: PaymentTerms = {
  deposit_cents: 0,
  deposit_per: "person",
  deadline: null,
  final_note: "From the day after the deadline, final payment in full.",
  methods: ["Cash", "MMG", "Bank Deposit"],
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
      <input
        type="checkbox"
        className="h-[18px] w-[18px] accent-green"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Occupancy + children pricing (controlled). value === null => flat price only.
// ---------------------------------------------------------------------------
export function OccupancyPricingFields({
  value,
  onChange,
}: {
  value: TourPricing | null;
  onChange: (v: TourPricing | null) => void;
}) {
  const v = value ?? DEFAULT_PRICING;

  function setOccupancy(i: number, patch: Partial<OccupancyTier>) {
    onChange({
      ...v,
      occupancy: v.occupancy.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    });
  }
  function addOccupancy() {
    onChange({
      ...v,
      occupancy: [
        ...v.occupancy,
        { occupants: v.occupancy.length + 1, label: "", price_cents: 0 },
      ],
    });
  }
  function removeOccupancy(i: number) {
    onChange({ ...v, occupancy: v.occupancy.filter((_, idx) => idx !== i) });
  }
  function setChild(i: number, patch: Partial<ChildTier>) {
    onChange({
      ...v,
      children: v.children.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    });
  }
  function setAllowsChildren(on: boolean) {
    onChange({
      ...v,
      children: on
        ? v.children.length
          ? v.children
          : DEFAULT_CHILD_TIERS.map((t) => ({ ...t }))
        : [],
    });
  }

  const allowsChildren = v.children.length > 0;

  return (
    <div className={cardCls}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 font-serif text-[20px] font-semibold text-ink">
            Occupancy &amp; children pricing
          </h3>
          <p className="m-0 mt-1 text-[13px] text-muted-light">
            Flat rates by room occupancy (total for that tier), with optional
            per-child add-ons. Amounts in GYD. Leave off to use the single
            starting price above.
          </p>
        </div>
        <Toggle
          checked={value !== null}
          onChange={(on) =>
            onChange(
              on
                ? { occupancy: DEFAULT_OCCUPANCY_TIERS, children: [] }
                : null,
            )
          }
          label="Configure"
        />
      </div>

      {value !== null && (
        <div className="flex flex-col gap-5">
          <div>
            <h4 className="m-0 mb-2.5 font-sans text-[14px] font-semibold text-ink">
              Room occupancy
            </h4>
            <div className="flex flex-col gap-3">
              {v.occupancy.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[90px_1fr_180px_auto] items-end gap-3 rounded-lg border border-ink/10 bg-cream/40 p-3.5 max-[700px]:grid-cols-1"
                >
                  <div>
                    <label className={labelCls}>Persons</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="1"
                      value={t.occupants}
                      onChange={(e) =>
                        setOccupancy(i, { occupants: Number(e.target.value || 1) })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Label</label>
                    <input
                      className={inputCls}
                      value={t.label}
                      onChange={(e) => setOccupancy(i, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Price for occupants (GYD)</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={toGyd(t.price_cents)}
                      onChange={(e) =>
                        setOccupancy(i, { price_cents: toCents(e.target.value) })
                      }
                    />
                  </div>
                  <ConfirmButton
                    title="Remove tier?"
                    confirmText="This occupancy tier will be removed from the pricing form."
                    onConfirm={() => removeOccupancy(i)}
                  >
                    Remove
                  </ConfirmButton>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button type="button" className={btnGhost} onClick={addOccupancy}>
                + Add occupancy tier
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
              <h4 className="m-0 font-sans text-[14px] font-semibold text-ink">
                Children occupancy
              </h4>
              <Toggle
                checked={allowsChildren}
                onChange={setAllowsChildren}
                label="Allow children"
              />
            </div>
            {allowsChildren ? (
              <div className="flex flex-col gap-3">
                {v.children.map((c, i) => (
                  <div
                    key={c.key}
                    className="grid grid-cols-[1fr_180px] items-end gap-3 rounded-lg border border-ink/10 bg-cream/40 p-3.5 max-[700px]:grid-cols-1"
                  >
                    <div>
                      <label className={labelCls}>Label</label>
                      <input
                        className={inputCls}
                        value={c.label}
                        onChange={(e) => setChild(i, { label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Price / child (GYD)</label>
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={toGyd(c.price_cents)}
                        onChange={(e) =>
                          setChild(i, { price_cents: toCents(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 rounded-lg bg-cream/60 p-3.5 text-[13px] text-ink-soft">
                Bookings use room occupancy only — no child add-ons on this tour.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment-terms editor (controlled, always-on). Reused by the per-tour override
// wrapper below and by the global default block editor.
// ---------------------------------------------------------------------------
export function PaymentTermsForm({
  value,
  onChange,
}: {
  value: PaymentTerms;
  onChange: (v: PaymentTerms) => void;
}) {
  function setMethod(i: number, text: string) {
    onChange({
      ...value,
      methods: value.methods.map((m, idx) => (idx === i ? text : m)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
        <div>
          <label className={labelCls}>Deposit amount (GYD)</label>
          <input
            className={inputCls}
            type="number"
            min="0"
            value={toGyd(value.deposit_cents)}
            onChange={(e) =>
              onChange({ ...value, deposit_cents: toCents(e.target.value) })
            }
          />
        </div>
        <div>
          <label className={labelCls}>Deposit charged per</label>
          <select
            className={inputCls}
            value={value.deposit_per}
            onChange={(e) =>
              onChange({
                ...value,
                deposit_per: e.target.value as PaymentTerms["deposit_per"],
              })
            }
          >
            <option value="person">Per person</option>
            <option value="booking">Per booking</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Book-by deadline</label>
          <input
            className={inputCls}
            type="date"
            value={value.deadline ?? ""}
            onChange={(e) =>
              onChange({ ...value, deadline: e.target.value || null })
            }
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Final-payment note</label>
        <textarea
          className={`${inputCls} min-h-[70px] resize-y`}
          value={value.final_note}
          onChange={(e) => onChange({ ...value, final_note: e.target.value })}
        />
      </div>
      <div>
        <label className={labelCls}>Payment methods</label>
        <div className="flex flex-col gap-2">
          {value.methods.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={m}
                onChange={(e) => setMethod(i, e.target.value)}
              />
              <ConfirmButton
                title="Remove payment method?"
                confirmText="This payment method will be removed from the form."
                onConfirm={() =>
                  onChange({
                    ...value,
                    methods: value.methods.filter((_, idx) => idx !== i),
                  })
                }
              >
                Remove
              </ConfirmButton>
            </div>
          ))}
        </div>
        <div className="mt-2.5">
          <button
            type="button"
            className={btnGhost}
            onClick={() => onChange({ ...value, methods: [...value.methods, ""] })}
          >
            + Add method
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-tour payment override (controlled). value === null => inherit global.
// ---------------------------------------------------------------------------
export function PaymentTermsOverrideFields({
  value,
  onChange,
  defaultTerms,
}: {
  value: PaymentTerms | null;
  onChange: (v: PaymentTerms | null) => void;
  defaultTerms: PaymentTerms | null;
}) {
  const fallback = defaultTerms ?? DEFAULT_PAYMENT_TERMS;

  return (
    <div className={cardCls}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 font-serif text-[20px] font-semibold text-ink">
            Payment terms
          </h3>
          <p className="m-0 mt-1 text-[13px] text-muted-light">
            By default this tour uses the global payment terms. Turn on to set
            terms just for this tour.
          </p>
        </div>
        <Toggle
          checked={value !== null}
          onChange={(on) => onChange(on ? { ...fallback } : null)}
          label="Override"
        />
      </div>

      {value !== null ? (
        <PaymentTermsForm value={value} onChange={onChange} />
      ) : (
        <p className="m-0 rounded-lg bg-cream/60 p-3.5 text-[13px] text-ink-soft">
          Using global default:{" "}
          <strong>{formatPrice(fallback.deposit_cents)}</strong> deposit per{" "}
          {fallback.deposit_per}
          {fallback.deadline ? ` to book by ${formatDate(fallback.deadline)}` : ""}
          {fallback.methods.length ? ` · ${fallback.methods.join(", ")}` : ""}.
        </p>
      )}
    </div>
  );
}
