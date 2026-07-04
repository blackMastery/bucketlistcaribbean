"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/account/actions";

export function ProfileForm({
  fullName: initialName,
  phone: initialPhone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfile({ fullName, phone });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Could not save profile.");
      }
    });
  }

  const label = "mb-1.5 block font-sans text-[12.5px] font-semibold text-ink-soft";
  const field =
    "w-full rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green";

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <h2 className="m-0 mb-5 font-serif text-[22px] font-semibold text-ink">
        Contact information
      </h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className={label} htmlFor="profile-name">
            Full name
          </label>
          <input
            id="profile-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={field}
            required
          />
        </div>
        <div>
          <label className={label} htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            readOnly
            className={`${field} bg-cream text-muted`}
          />
          <p className="m-0 mt-1 text-[12px] text-muted">
            Change email in Settings.
          </p>
        </div>
      </div>
      {error && (
        <p className="m-0 mt-3 text-[13px] text-coral" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="m-0 mt-3 text-[13px] text-green">Profile saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-green px-6 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
