"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";
  const referralCode = params.get("ref")?.trim() || undefined;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setPending(false);
        return;
      }
      window.location.assign(redirect);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(referralCode ? { referral_code: referralCode } : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      setPending(false);
      return;
    }
    if (data.session) {
      window.location.assign(redirect);
      return;
    }
    setCheckEmail(true);
    setPending(false);
  }

  const field =
    "w-full rounded-lg border-[1.5px] border-ink/15 bg-white px-3.5 py-3 font-body text-[14px] text-ink outline-none focus:border-green";
  const label = "mb-[7px] block font-sans text-[12.5px] font-semibold text-ink-soft";

  if (checkEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-green/[0.12] text-green">
          <Icon name="mail" size={30} strokeWidth={1.75} />
        </div>
        <h2 className="m-0 mb-2.5 font-serif text-[24px] font-semibold text-ink">
          Confirm your email
        </h2>
        <p className="m-0 text-[14px] leading-[1.6] text-muted">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <h1 className="m-0 mb-1.5 font-serif text-[28px] font-bold text-ink">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="m-0 mb-7 text-[14px] text-muted-light">
        {mode === "login"
          ? "Sign in to save tours and track your requests."
          : "Save your favorite journeys and manage booking requests."}
      </p>

      {mode === "signup" && (
        <div className="mb-[18px]">
          <label className={label}>Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Traveler"
            className={field}
            required
          />
        </div>
      )}
      <div className="mb-[18px]">
        <label className={label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={field}
          required
        />
      </div>
      <div className="mb-6">
        <label className={label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={field}
          minLength={6}
          required
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-[#FDF6F5] px-3.5 py-2.5 text-[13px] text-[#C0524A]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-green py-4 font-sans text-[16px] font-semibold text-sand shadow-[0_6px_20px_rgba(27,122,92,0.3)] transition-all hover:-translate-y-px hover:bg-green-dark disabled:opacity-70"
      >
        {pending ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      <p className="m-0 mt-5 text-center text-[14px] text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-green no-underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-green no-underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
