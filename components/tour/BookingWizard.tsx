"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createBookingRequest } from "@/app/actions";
import { Icon } from "@/components/icons";
import { BookingStepIndicator } from "@/components/tour/BookingStepIndicator";
import {
  TravelerBasicForm,
  emptyTravelerBasic,
} from "@/components/tour/TravelerBasicForm";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import {
  computeBookingTotalCents,
  computeDepositCents,
  computePeopleCount,
  type BookingSelection,
} from "@/lib/pricing";
import { expandTravelerSlots, splitFullName, formatTravelerName, type TravelerDetailsInput } from "@/lib/travelers";
import type { TourPricing, PaymentTerms } from "@/lib/database.types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const FLAT_STEPS = ["Trip", "Contact", "Review"] as const;
const TIERED_STEPS = ["Trip", "Contact", "Travelers", "Review"] as const;

export function BookingWizard({
  tourId,
  basePriceCents,
  spotsLeft,
  pricing,
  paymentTerms,
  depositOpen,
}: {
  tourId: string;
  basePriceCents: number;
  spotsLeft: number | null;
  pricing: TourPricing | null;
  paymentTerms: PaymentTerms | null;
  depositOpen: boolean;
}) {
  const occupancy = pricing?.occupancy ?? [];
  const childTiers = pricing?.children ?? [];
  const hasTiers = occupancy.length > 0;
  const steps = hasTiers ? TIERED_STEPS : FLAT_STEPS;
  const reviewStep = steps.length;

  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [occIdx, setOccIdx] = useState(0);
  const [childCounts, setChildCounts] = useState<number[]>(() =>
    childTiers.map(() => 0),
  );
  const [travelers, setTravelers] = useState(2);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [booked, setBooked] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [travelerDetails, setTravelerDetails] = useState<TravelerDetailsInput[]>([]);

  const selection: BookingSelection = {
    occupancyIndex: hasTiers ? occIdx : null,
    childCounts,
    travelers,
  };
  const people = computePeopleCount(pricing, selection);
  const travelerSlots = useMemo(
    () => (hasTiers ? expandTravelerSlots(pricing, selection) : []),
    [hasTiers, pricing, occIdx, childCounts, travelers],
  );

  useEffect(() => {
    if (!hasTiers) return;
    setTravelerDetails((prev) =>
      travelerSlots.map((_, i) => prev[i] ?? emptyTravelerBasic()),
    );
  }, [hasTiers, travelerSlots.length, occIdx, childCounts.join(",")]);

  useEffect(() => {
    if (!hasTiers) return;
    const { firstName, lastName } = splitFullName(contactName);
    setTravelerDetails((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      next[0] = {
        ...next[0],
        firstName: firstName || next[0].firstName,
        lastName: lastName || next[0].lastName,
        phone: contactPhone.trim() || next[0].phone,
      };
      return next;
    });
  }, [contactName, contactPhone, hasTiers]);

  const totalCents = computeBookingTotalCents(pricing, basePriceCents, selection);
  const depositCents = computeDepositCents(paymentTerms, depositOpen, people);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      if (user.email) setContactEmail(user.email);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) setContactName(profile.full_name);
      if (profile?.phone) setContactPhone(profile.phone);
    });
  }, []);

  function setChild(i: number, v: number) {
    setChildCounts((s) => s.map((n, idx) => (idx === i ? Math.max(0, v) : n)));
  }

  function validateTripStep(): string | null {
    if (!date) return "Please select a travel date.";
    if (date < todayISO()) return "Travel date must be today or later.";
    if (people < 1) return "Please select at least one traveler.";
    return null;
  }

  function validateContactStep(): string | null {
    if (!contactName.trim()) return "Please enter your name.";
    if (!isValidEmail(contactEmail)) return "Please enter a valid email.";
    if (!contactPhone.trim()) return "Please enter your phone number.";
    return null;
  }

  function validateTravelersStep(): string | null {
    for (let i = 0; i < travelerSlots.length; i++) {
      const t = travelerDetails[i];
      const label = travelerSlots[i].label;
      if (!t?.firstName.trim()) {
        return `Please enter the first name for ${label}.`;
      }
      if (!t?.lastName.trim()) {
        return `Please enter the last name for ${label}.`;
      }
      if (!t?.phone.trim()) {
        return `Please enter a phone number for ${label}.`;
      }
      if (!t?.passportNumber.trim()) {
        return `Please enter a passport number for ${label}.`;
      }
      if (!t.dateOfBirth) {
        return `Please enter the date of birth for ${label}.`;
      }
      if (!t.gender) {
        return `Please select gender for ${label}.`;
      }
    }
    return null;
  }

  function validateCurrentStep(): string | null {
    if (step === 1) return validateTripStep();
    if (step === 2) return validateContactStep();
    if (hasTiers && step === 3) return validateTravelersStep();
    return null;
  }

  function goNext() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, reviewStep));
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function book() {
    const tripErr = validateTripStep();
    if (tripErr) {
      setError(tripErr);
      setStep(1);
      return;
    }
    const contactErr = validateContactStep();
    if (contactErr) {
      setError(contactErr);
      setStep(2);
      return;
    }
    if (hasTiers) {
      const travelersErr = validateTravelersStep();
      if (travelersErr) {
        setError(travelersErr);
        setStep(3);
        return;
      }
    }
    setError("");

    startTransition(async () => {
      const res = await createBookingRequest({
        tourId,
        travelDate: date,
        occupancyIndex: selection.occupancyIndex,
        childCounts: selection.childCounts,
        travelers: selection.travelers,
        insurance: false,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        specialRequests: specialRequests.trim() || undefined,
        travelerDetails: hasTiers
          ? travelerDetails.map((t) => ({
              firstName: t.firstName.trim(),
              lastName: t.lastName.trim(),
              phone: t.phone.trim(),
              passportNumber: t.passportNumber.trim(),
              dateOfBirth: t.dateOfBirth,
              gender: t.gender,
            }))
          : undefined,
      });
      if (res.ok && res.referenceCode) {
        setReferenceCode(res.referenceCode);
        setBooked(true);
      } else {
        setError(res.error ?? "Could not submit your request.");
      }
    });
  }

  function resetForm() {
    setBooked(false);
    setReferenceCode("");
    setError("");
    setStep(1);
  }

  const labelCls =
    "mb-1.5 block font-sans text-[12px] font-semibold text-muted";
  const fieldCls =
    "w-full rounded-lg border-[1.5px] border-ink/15 px-3.5 py-3 font-body text-[14px] text-ink outline-none focus:border-green";

  if (booked) {
    return (
      <div
        className="rounded-2xl border border-gold/25 bg-white p-[26px] shadow-[0_8px_32px_rgba(27,122,92,0.12)]"
        style={{ animation: "mcFadeIn 0.4s ease both" }}
      >
        <div className="py-3.5 text-center">
          <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-green/[0.12] text-green">
            <Icon name="check" size={30} strokeWidth={2} />
          </div>
          <h3 className="m-0 mb-2 font-serif text-[22px] font-semibold text-ink">
            Request received!
          </h3>
          <p className="m-0 mb-3 text-[14px] leading-[1.6] text-muted">
            Your concierge will confirm availability and reach out within 24
            hours.
          </p>
          <div className="mb-4 rounded-xl bg-cream px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[1px] text-muted">
              Booking reference
            </div>
            <div className="font-serif text-[26px] font-bold text-green">
              {referenceCode}
            </div>
          </div>
          <p className="m-0 mb-[18px] text-[13px] leading-[1.6] text-muted">
            Save this reference — we&apos;ve also emailed it to{" "}
            <strong className="text-ink">{contactEmail}</strong>.
          </p>
          <Link
            href={`/bookings/track?ref=${encodeURIComponent(referenceCode)}`}
            className="mb-3 inline-block w-full rounded-lg bg-green py-3.5 text-center font-sans text-[15px] font-semibold text-sand no-underline shadow-[0_6px_20px_rgba(27,122,92,0.3)]"
          >
            Track your booking
          </Link>
          <button
            onClick={resetForm}
            className="w-full rounded-lg border-2 border-gold px-6 py-[11px] font-sans text-[14px] font-semibold text-green"
          >
            Make Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-white p-[26px] shadow-[0_8px_32px_rgba(27,122,92,0.12)]">
      {spotsLeft != null && spotsLeft < 20 && (
        <p className="m-0 mb-4 text-center font-sans text-[12px] font-semibold text-coral">
          Only {spotsLeft} spots left
        </p>
      )}

      <BookingStepIndicator steps={[...steps]} currentStep={step} />

      <div className="flex flex-col gap-4">
        {step === 1 && (
          <>
            <h2 className="m-0 font-serif text-[22px] font-semibold text-ink">
              When are you travelling?
            </h2>
            <div>
              <label className={labelCls}>Travel date</label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className={fieldCls}
                required
              />
            </div>

            {hasTiers ? (
              <>
                <div>
                  <label className={labelCls}>Room occupancy</label>
                  <select
                    value={occIdx}
                    onChange={(e) => setOccIdx(Number(e.target.value))}
                    className={`${fieldCls} cursor-pointer bg-white`}
                  >
                    {occupancy.map((t, i) => (
                      <option key={i} value={i}>
                        {t.label} — {formatPrice(t.price_cents)}
                      </option>
                    ))}
                  </select>
                </div>
                {childTiers.map((c, i) => (
                  <div key={c.key}>
                    <label className={labelCls}>
                      {c.label} — {formatPrice(c.price_cents)} / child
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={childCounts[i] ?? 0}
                      onChange={(e) => setChild(i, Number(e.target.value || 0))}
                      className={fieldCls}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div>
                <label className={labelCls}>Travelers</label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className={`${fieldCls} cursor-pointer bg-white`}
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((v) => (
                    <option key={v} value={v}>
                      {v} {v === 1 ? "traveler" : "travelers"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-cream/50 px-4 py-3">
              <span className="font-sans text-[14px] text-muted">Estimated total</span>
              <span className="font-serif text-[20px] font-bold text-green">
                {formatPrice(totalCents)}
              </span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="m-0 font-serif text-[22px] font-semibold text-ink">
              Contact details
            </h2>
            <p className="m-0 text-[13px] leading-[1.5] text-muted">
              We&apos;ll use this to confirm your booking and send updates.
            </p>
            <div>
              <label className={labelCls}>Full name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={fieldCls}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={fieldCls}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={fieldCls}
                placeholder="+1 246 000 0000"
                autoComplete="tel"
                required
              />
            </div>
            <div>
              <label className={labelCls}>
                Special requests <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className={`${fieldCls} min-h-[72px] resize-y`}
                placeholder="Dietary needs, room preferences, accessibility…"
                rows={3}
              />
            </div>
          </>
        )}

        {hasTiers && step === 3 && (
          <>
            <h2 className="m-0 font-serif text-[22px] font-semibold text-ink">
              Traveler details
            </h2>
            <p className="m-0 text-[13px] leading-[1.5] text-muted">
              Enter details for each person travelling. Passport expiry and
              nationality can be added after booking.
            </p>
            <div className="flex flex-col gap-3">
              {travelerSlots.map((slot, i) => (
                <TravelerBasicForm
                  key={`${slot.position}-${slot.label}`}
                  label={slot.label}
                  value={travelerDetails[i] ?? emptyTravelerBasic()}
                  onChange={(next) =>
                    setTravelerDetails((prev) => {
                      const copy = [...prev];
                      copy[i] = next;
                      return copy;
                    })
                  }
                  labelCls={labelCls}
                  fieldCls={fieldCls}
                />
              ))}
            </div>
          </>
        )}

        {step === reviewStep && (
          <>
            <h2 className="m-0 font-serif text-[22px] font-semibold text-ink">
              Review your booking
            </h2>
            <div className="flex flex-col gap-3 rounded-xl border border-ink/[0.08] bg-cream/30 p-4">
              <div className="flex justify-between gap-4 text-[14px]">
                <span className="text-muted">Travel date</span>
                <span className="font-semibold text-ink">{formatDate(date)}</span>
              </div>
              <div className="flex justify-between gap-4 text-[14px]">
                <span className="text-muted">Party size</span>
                <span className="font-semibold text-ink">
                  {people} {people === 1 ? "person" : "people"}
                </span>
              </div>
              {hasTiers && (
                <div className="flex justify-between gap-4 text-[14px]">
                  <span className="text-muted">Room</span>
                  <span className="font-semibold text-ink">
                    {occupancy[occIdx]?.label}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4 text-[14px]">
                <span className="text-muted">Contact</span>
                <span className="text-right font-semibold text-ink">
                  {contactName}
                  <br />
                  <span className="font-normal text-ink-soft">{contactEmail}</span>
                </span>
              </div>
              {specialRequests.trim() && (
                <div className="border-t border-ink/[0.08] pt-3 text-[14px]">
                  <span className="text-muted">Special requests</span>
                  <p className="m-0 mt-1 text-ink-soft">{specialRequests}</p>
                </div>
              )}
              {hasTiers && travelerDetails.length > 0 && (
                <div className="border-t border-ink/[0.08] pt-3 text-[14px]">
                  <span className="text-muted">Travelers</span>
                  <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
                    {travelerSlots.map((slot, i) => {
                      const t = travelerDetails[i];
                      if (!t) return null;
                      return (
                        <li key={slot.position} className="text-ink-soft">
                          <span className="font-semibold text-ink">
                            {formatTravelerName(t.firstName, t.lastName)}
                          </span>
                          {" · "}
                          {slot.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-ink/[0.08] pt-4">
              <span className="font-sans text-[15px] font-semibold text-ink">Total</span>
              <span className="font-serif text-[24px] font-bold text-green">
                {formatPrice(totalCents)}
              </span>
            </div>

            {paymentTerms && (
              <div className="rounded-[10px] bg-[#F7F3EA] p-3.5">
                {depositOpen ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 text-[13px] font-semibold text-ink">
                        Deposit due now
                        {paymentTerms.deposit_per === "person"
                          ? ` (${people} × ${formatPrice(paymentTerms.deposit_cents)})`
                          : ""}
                      </span>
                      <span className="font-sans text-[15px] font-bold text-green">
                        {formatPrice(depositCents)}
                      </span>
                    </div>
                    {paymentTerms.deadline && (
                      <p className="m-0 mt-1.5 text-[12px] leading-[1.5] text-ink-soft">
                        Pay your deposit to book by{" "}
                        <strong>{formatDate(paymentTerms.deadline)}</strong>. Balance
                        due after that.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="m-0 text-[13px] leading-[1.5] text-ink-soft">
                    <strong className="text-ink">Final payment in full.</strong>{" "}
                    {paymentTerms.final_note}
                  </p>
                )}
                {paymentTerms.methods.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {paymentTerms.methods.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-white px-2.5 py-1 font-sans text-[11px] font-semibold text-green"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <p
            className="m-0 rounded-lg bg-coral/[0.1] px-3.5 py-2.5 text-[13px] text-coral"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={pending}
              className="flex-1 rounded-lg border-2 border-gold px-6 py-3.5 font-sans text-[15px] font-semibold text-green disabled:opacity-70"
            >
              Back
            </button>
          )}
          {step < reviewStep ? (
            <button
              type="button"
              onClick={goNext}
              disabled={pending}
              className="flex-1 rounded-lg bg-green py-3.5 font-sans text-[15px] font-semibold text-sand shadow-[0_6px_20px_rgba(27,122,92,0.3)] transition-all hover:-translate-y-px hover:bg-green-dark disabled:opacity-70"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={book}
              disabled={pending}
              className="flex-1 rounded-lg bg-green py-3.5 font-sans text-[15px] font-semibold text-sand shadow-[0_6px_20px_rgba(27,122,92,0.3)] transition-all hover:-translate-y-px hover:bg-green-dark disabled:opacity-70"
            >
              {pending ? "Sending…" : "Submit booking request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
