"use client";

import { useState } from "react";
import { signOut } from "@/app/actions";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    const res = await signOut();
    if (!res.ok) {
      setError(res.error ?? "Could not sign out. Please try again.");
      setPending(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="rounded-lg border-2 border-gold px-6 py-2.5 font-sans text-[14px] font-semibold text-green transition-colors hover:bg-gold hover:text-white disabled:opacity-70"
      >
        {pending ? "Signing out…" : "Sign Out"}
      </button>
      {error && (
        <p className="m-0 text-[12.5px] text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
