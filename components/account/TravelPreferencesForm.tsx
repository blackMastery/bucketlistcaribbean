"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TravelPreferences } from "@/lib/account";
import { updateTravelPreferences } from "@/app/account/actions";

const INTEREST_OPTIONS = [
  "Adventure",
  "Food & wine",
  "Culture",
  "Beach & relaxation",
  "Wildlife",
  "Luxury resorts",
];

export function TravelPreferencesForm({
  preferences,
}: {
  preferences: TravelPreferences | null;
}) {
  const router = useRouter();
  const [dietary, setDietary] = useState(preferences?.dietary ?? "");
  const [mobility, setMobility] = useState(preferences?.mobility ?? "");
  const [roomPreference, setRoomPreference] = useState(
    preferences?.room_preference ?? "",
  );
  const [notes, setNotes] = useState(preferences?.notes ?? "");
  const [interests, setInterests] = useState<string[]>(
    preferences?.interests ?? [],
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await updateTravelPreferences({
        dietary,
        mobility,
        room_preference: roomPreference,
        notes,
        interests,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Could not save preferences.");
      }
    });
  }

  const label = "mb-1.5 block font-sans text-[12.5px] font-semibold text-ink-soft";
  const field =
    "w-full rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green";

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <h2 className="m-0 mb-1 font-serif text-[22px] font-semibold text-ink">
        Travel preferences
      </h2>
      <p className="m-0 mb-5 text-[13px] text-muted">
        Help your concierge personalize future journeys.
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <label className={label}>Dietary restrictions</label>
          <input
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            className={field}
            placeholder="e.g. vegetarian, nut allergy"
          />
        </div>
        <div>
          <label className={label}>Mobility / access needs</label>
          <input
            value={mobility}
            onChange={(e) => setMobility(e.target.value)}
            className={field}
            placeholder="e.g. step-free access, wheelchair"
          />
        </div>
        <div>
          <label className={label}>Room preference</label>
          <input
            value={roomPreference}
            onChange={(e) => setRoomPreference(e.target.value)}
            className={field}
            placeholder="e.g. ocean view, king bed"
          />
        </div>
        <div>
          <label className={label}>Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleInterest(item)}
                className={`rounded-full border px-3 py-1.5 font-sans text-[12.5px] font-medium transition-colors ${
                  interests.includes(item)
                    ? "border-green bg-green/[0.12] text-green"
                    : "border-ink/15 bg-white text-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>Additional notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${field} resize-none`}
            placeholder="Anything else we should know when planning your trips"
          />
        </div>
      </div>
      {error && (
        <p className="m-0 mt-3 text-[13px] text-coral" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="m-0 mt-3 text-[13px] text-green">Preferences saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-green px-6 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
