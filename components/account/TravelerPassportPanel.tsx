"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTravelerPassport } from "@/app/account/actions";
import type { BookingTravelerDetail } from "@/lib/database.types";
import { COUNTRIES } from "@/lib/countries";
import { formatDate } from "@/lib/format";
import {
  formatTravelerName,
  maskPassportNumber,
  validatePassportExpiry,
} from "@/lib/travelers";

const labelCls =
  "mb-1.5 block font-sans text-[12px] font-semibold text-muted";
const fieldCls =
  "w-full rounded-lg border-[1.5px] border-ink/15 px-3.5 py-3 font-body text-[14px] text-ink outline-none focus:border-green";

function TravelerInternationalForm({
  traveler,
  travelDate,
  referenceCode,
  email,
  disabled,
  onSaved,
}: {
  traveler: BookingTravelerDetail;
  travelDate: string | null;
  referenceCode?: string;
  email?: string;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [passportExpiry, setPassportExpiry] = useState(
    traveler.passport_expiry ?? "",
  );
  const [nationality, setNationality] = useState(traveler.nationality ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const hasPassportNumber = Boolean(traveler.passport_number?.trim());
  const complete = traveler.passport_complete;

  function save() {
    setError("");
    setSuccess(false);
    if (!passportExpiry) {
      setError("Please enter a passport expiry date.");
      return;
    }
    if (!nationality) {
      setError("Please select a nationality.");
      return;
    }
    if (travelDate) {
      const expiryError = validatePassportExpiry(passportExpiry, travelDate);
      if (expiryError) {
        setError(expiryError);
        return;
      }
    }

    startTransition(async () => {
      const res = await updateTravelerPassport({
        travelerId: traveler.id,
        passportExpiry,
        nationality,
        referenceCode,
        email,
        travelDate,
      });
      if (res.ok) {
        setSuccess(true);
        router.refresh();
        onSaved();
      } else {
        setError(res.error ?? "Could not save travel details.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-sans text-[14px] font-semibold text-ink">
            {formatTravelerName(traveler.first_name, traveler.last_name)}
          </div>
          <div className="text-[12px] text-muted">
            {traveler.traveler_type === "child"
              ? traveler.child_tier_label ?? "Child"
              : "Adult"}
            {traveler.date_of_birth
              ? ` · DOB ${formatDate(traveler.date_of_birth)}`
              : ""}
            {traveler.phone ? ` · ${traveler.phone}` : ""}
          </div>
        </div>
        <span
          className={`rounded-md px-2.5 py-0.5 font-sans text-[11px] font-semibold ${
            complete
              ? "bg-green/[0.12] text-green"
              : hasPassportNumber
                ? "bg-gold/15 text-gold-deep"
                : "bg-coral/[0.12] text-coral"
          }`}
        >
          {complete
            ? "Complete"
            : hasPassportNumber
              ? "Expiry & nationality needed"
              : "Passport needed"}
        </span>
      </div>

      {disabled ? (
        <p className="m-0 text-[13px] text-muted">
          Travel details can no longer be updated for this booking.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {hasPassportNumber && (
            <div>
              <label className={labelCls}>Passport number</label>
              <div className={`${fieldCls} bg-cream/50 text-muted`}>
                {maskPassportNumber(traveler.passport_number!)}
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Passport expiry date</label>
            <input
              type="date"
              value={passportExpiry}
              onChange={(e) => setPassportExpiry(e.target.value)}
              className={fieldCls}
              disabled={pending}
            />
            {travelDate && (
              <p className="mt-1 mb-0 text-[11px] text-muted">
                Must be valid at least 6 months past{" "}
                {formatDate(travelDate)}.
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Nationality</label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className={`${fieldCls} cursor-pointer bg-white`}
              disabled={pending}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="m-0 text-[13px] text-coral" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="m-0 text-[13px] text-green">Travel details saved.</p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="self-start rounded-lg bg-green px-5 py-2.5 font-sans text-[14px] font-semibold text-sand disabled:opacity-70"
          >
            {pending ? "Saving…" : "Save travel details"}
          </button>
        </div>
      )}
    </div>
  );
}

export function TravelerPassportPanel({
  travelers,
  travelDate,
  status,
  referenceCode,
  email,
  onRefresh,
}: {
  travelers: BookingTravelerDetail[];
  travelDate: string | null;
  status: string;
  referenceCode?: string;
  email?: string;
  onRefresh?: () => void;
}) {
  if (travelers.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const disabled =
    status === "cancelled" ||
    (travelDate != null && travelDate < today);

  const incomplete = travelers.filter((t) => !t.passport_complete).length;

  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="mb-1 font-sans text-[12px] font-semibold uppercase tracking-[1px] text-muted">
        International travel
      </div>
      <h2 className="m-0 mb-2 font-serif text-[20px] font-semibold text-ink">
        Passport expiry & nationality
      </h2>
      <p className="m-0 mb-5 text-[14px] leading-[1.6] text-muted">
        {incomplete > 0
          ? `${incomplete} traveler${incomplete === 1 ? "" : "s"} still need expiry date and nationality before departure.`
          : "All travelers have complete international travel details on file."}
      </p>
      <div className="flex flex-col gap-4">
        {travelers.map((traveler) => (
          <TravelerInternationalForm
            key={`${traveler.id}-${traveler.passport_complete}`}
            traveler={traveler}
            travelDate={travelDate}
            referenceCode={referenceCode}
            email={email}
            disabled={disabled}
            onSaved={() => onRefresh?.()}
          />
        ))}
      </div>
    </div>
  );
}
