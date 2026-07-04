"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { submitContact } from "@/app/actions";
import { isValidEmail } from "@/lib/validation";

const INTERESTS = [
  "St. Lucia",
  "Barbados",
  "Jamaica",
  "The Bahamas",
  "Turks & Caicos",
  "Grenada",
  "Not sure yet — surprise me",
];

type Errors = { name?: boolean; email?: boolean; message?: boolean };

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const [err, setErr] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [sentName, setSentName] = useState("");
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
    setErr((e) => ({ ...e, [k]: false }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!f.name.trim()) e.name = true;
    if (!isValidEmail(f.email)) e.email = true;
    if (!f.message.trim()) e.message = true;
    return e;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErr(e);
      return;
    }
    startTransition(async () => {
      const res = await submitContact(f);
      if (res.ok) {
        setSentName(f.name.trim().split(" ")[0]);
        setSent(true);
      }
    });
  }

  const label = "mb-[7px] block font-sans text-[12.5px] font-semibold text-ink-soft";
  const base =
    "w-full rounded-lg border-[1.5px] px-3.5 py-3 font-body text-[14px] text-ink outline-none focus:border-green";
  const ok = "border-ink/15 bg-white";
  const bad = "border-[#E0857E] bg-[#FDF6F5]";

  if (sent) {
    return (
      <div className="rounded-[18px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="py-10 text-center">
          <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green/[0.12] text-green">
            <Icon name="check" size={36} strokeWidth={2} />
          </div>
          <h2 className="m-0 mb-2.5 font-serif text-[28px] font-semibold text-ink">
            Message sent!
          </h2>
          <p className="mx-auto m-0 mb-6 max-w-[380px] text-[15px] leading-[1.6] text-muted">
            Thank you, {sentName}. A concierge will be in touch within 24 hours
            to start shaping your journey.
          </p>
          <button
            onClick={() => {
              setF({ name: "", email: "", phone: "", interest: "", message: "" });
              setErr({});
              setSent(false);
            }}
            className="rounded-lg border-2 border-gold px-7 py-3 font-sans text-[14px] font-semibold text-green"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] sm:p-10">
      <h2 className="m-0 mb-1.5 font-serif text-[26px] font-semibold text-ink">
        Send us a message
      </h2>
      <p className="m-0 mb-7 text-[14px] text-muted-light">
        Fields marked with <span className="text-coral">*</span> are required.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-[18px] grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1">
          <div>
            <label className={label}>
              Full name <span className="text-coral">*</span>
            </label>
            <input
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Traveler"
              className={`${base} ${err.name ? bad : ok}`}
            />
            {err.name && (
              <div className="mt-[5px] text-[12px] text-[#C0524A]">
                Please enter your name
              </div>
            )}
          </div>
          <div>
            <label className={label}>
              Email <span className="text-coral">*</span>
            </label>
            <input
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@email.com"
              className={`${base} ${err.email ? bad : ok}`}
            />
            {err.email && (
              <div className="mt-[5px] text-[12px] text-[#C0524A]">
                Enter a valid email address
              </div>
            )}
          </div>
        </div>
        <div className="mb-[18px] grid grid-cols-2 gap-[18px] max-[600px]:grid-cols-1">
          <div>
            <label className={label}>Phone</label>
            <input
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 (000) 000-0000"
              className={`${base} ${ok}`}
            />
          </div>
          <div>
            <label className={label}>Tour interest</label>
            <select
              value={f.interest}
              onChange={(e) => set("interest", e.target.value)}
              className={`${base} ${ok} cursor-pointer`}
            >
              <option value="">Select a destination…</option>
              {INTERESTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className={label}>
            Message <span className="text-coral">*</span>
          </label>
          <textarea
            value={f.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Tell us about your dream trip — when, who's travelling, and what you love…"
            rows={5}
            className={`${base} ${err.message ? bad : ok} min-h-[120px] resize-y leading-[1.5]`}
          />
          {err.message && (
            <div className="mt-[5px] text-[12px] text-[#C0524A]">
              Please add a short message
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-green py-4 font-sans text-[16px] font-semibold text-sand shadow-[0_6px_20px_rgba(27,122,92,0.3)] transition-all hover:-translate-y-px hover:bg-green-dark disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send Message"}
        </button>
        <p className="m-0 mt-4 text-center text-[13px] text-muted-light">
          We&apos;ll respond within 24 hours.
        </p>
      </form>
    </div>
  );
}
