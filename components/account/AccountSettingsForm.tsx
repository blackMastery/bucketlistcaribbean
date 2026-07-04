"use client";

import { useState, useTransition } from "react";
import {
  updatePassword,
  updateEmail,
  deleteAccount,
} from "@/app/account/actions";

export function AccountSettingsForm({
  email,
  canDelete,
}: {
  email: string;
  canDelete: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [newEmail, setNewEmail] = useState(email);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const label = "mb-1.5 block font-sans text-[12.5px] font-semibold text-ink-soft";
  const field =
    "w-full rounded-lg border border-ink/15 px-3.5 py-2.5 font-body text-[14px] outline-none focus:border-green";

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg("");
          setError("");
          startTransition(async () => {
            const res = await updatePassword({ password, confirm });
            if (res.ok) {
              setMsg("Password updated.");
              setPassword("");
              setConfirm("");
            } else {
              setError(res.error ?? "Could not update password.");
            }
          });
        }}
        className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      >
        <h2 className="m-0 mb-4 font-serif text-[22px] font-semibold text-ink">
          Change password
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={label}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className={label}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={field}
              minLength={8}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-green px-6 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
        >
          Update password
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg("");
          setError("");
          startTransition(async () => {
            const res = await updateEmail({ email: newEmail });
            if (res.ok) {
              setMsg(
                "Confirmation sent to your new email address. Check your inbox to complete the change.",
              );
            } else {
              setError(res.error ?? "Could not update email.");
            }
          });
        }}
        className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
      >
        <h2 className="m-0 mb-4 font-serif text-[22px] font-semibold text-ink">
          Change email
        </h2>
        <div>
          <label className={label}>New email address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={field}
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-green px-6 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
        >
          Update email
        </button>
      </form>

      <div className="rounded-2xl border border-coral/30 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h2 className="m-0 mb-2 font-serif text-[22px] font-semibold text-coral">
          Delete account
        </h2>
        <p className="m-0 mb-4 text-[14px] text-muted">
          Permanently delete your account and personal data. Your booking history
          will be unlinked but retained for our records.
        </p>
        {!canDelete ? (
          <p className="m-0 text-[13px] text-muted">
            Account deletion is unavailable. Please contact support.
          </p>
        ) : (
          <>
            <label className={label}>
              Type DELETE to confirm
            </label>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={field}
              placeholder="DELETE"
            />
            <button
              type="button"
              disabled={pending || deleteConfirm !== "DELETE"}
              onClick={() => {
                setMsg("");
                setError("");
                startTransition(async () => {
                  await deleteAccount();
                });
              }}
              className="mt-4 rounded-lg bg-coral px-6 py-2.5 font-sans text-[14px] font-semibold text-white disabled:opacity-60"
            >
              Delete my account
            </button>
          </>
        )}
      </div>

      {msg && <p className="m-0 text-[14px] text-green">{msg}</p>}
      {error && (
        <p className="m-0 text-[14px] text-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
