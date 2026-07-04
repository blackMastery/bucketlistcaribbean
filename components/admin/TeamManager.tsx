"use client";

import { useActionState, useId, useState } from "react";
import type { AdminUserRow } from "@/lib/database.types";
import { GRANTABLE_PAGES } from "@/lib/admin-pages";
import { Icon } from "@/components/icons";
import {
  addAdmin,
  updateMember,
  type TeamFormState,
} from "@/app/admin/access/actions";
import {
  Card,
  FormLabel,
  StatusBadge,
  inputCls,
  btnPrimary,
} from "@/components/admin/ui";

export type AdminMember = AdminUserRow & { pages: string[] };

const initialState: TeamFormState = {};

const selectCls = inputCls + " bg-white";

function FormMessage({ state }: { state: TeamFormState }) {
  if (state.error) {
    return (
      <p className="m-0 rounded-lg bg-coral/[0.12] px-3 py-2 text-[13px] font-medium text-coral">
        {state.error}
      </p>
    );
  }
  if (state.saved && state.message) {
    return (
      <p className="m-0 rounded-lg bg-green/[0.12] px-3 py-2 text-[13px] font-medium text-green">
        {state.message}
      </p>
    );
  }
  return null;
}

function AddAdminForm() {
  const [state, formAction, pending] = useActionState(addAdmin, initialState);
  const ids = useId();

  return (
    <Card>
      <h2 className="m-0 font-serif text-[18px] font-bold text-ink">Add an admin</h2>
      <p className="mt-1 text-[13px] text-muted">
        Creates a Supabase login and grants admin access. If the email is already
        registered, that account is promoted without changing its password.
      </p>
      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FormLabel htmlFor={`${ids}-email`} required>
            Email
          </FormLabel>
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            autoComplete="off"
            className={inputCls}
            required
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.email}</p>
          )}
        </div>
        <div>
          <FormLabel htmlFor={`${ids}-name`} required>
            Full name
          </FormLabel>
          <input
            id={`${ids}-name`}
            name="full_name"
            type="text"
            className={inputCls}
            required
          />
          {state.fieldErrors?.full_name && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.full_name}</p>
          )}
        </div>
        <div>
          <FormLabel htmlFor={`${ids}-password`} required>
            Temporary password
          </FormLabel>
          <input
            id={`${ids}-password`}
            name="password"
            type="text"
            autoComplete="off"
            minLength={8}
            className={inputCls}
            placeholder="At least 8 characters"
            required
          />
          {state.fieldErrors?.password && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.password}</p>
          )}
        </div>
        <div>
          <FormLabel htmlFor={`${ids}-role`} required>
            Role
          </FormLabel>
          <select id={`${ids}-role`} name="role" className={selectCls} defaultValue="admin">
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? "Adding…" : "Add admin"}
          </button>
          <FormMessage state={state} />
        </div>
      </form>
    </Card>
  );
}

function MemberRow({ member }: { member: AdminMember }) {
  const [state, formAction, pending] = useActionState(updateMember, initialState);
  const [role, setRole] = useState<AdminUserRow["role"]>(member.role);
  const ids = useId();
  const isSuperAdmin = role === "super_admin";

  return (
    <form action={formAction} className="px-5 py-4">
      <input type="hidden" name="admin_user_id" value={member.id} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[15px] font-semibold text-ink">
              {member.full_name}
            </span>
            <StatusBadge status={member.is_active ? "confirmed" : "archived"} />
          </div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted" title={member.email}>
            {member.email}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            Role
            <select
              name="role"
              className={selectCls + " w-auto py-1.5"}
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AdminUserRow["role"])
              }
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={member.is_active}
              className="h-4 w-4 accent-green"
            />
            Active
          </label>
        </div>
      </div>

      {isSuperAdmin ? (
        <p className="mt-3 rounded-lg bg-gold/[0.1] px-3 py-2 text-[12.5px] font-medium text-gold-deep">
          Super admins have full access to every section, including Admins.
        </p>
      ) : (
        <fieldset className="mt-3">
          <legend className="mb-2 font-sans text-[12.5px] font-semibold text-ink-soft">
            Section access
          </legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {GRANTABLE_PAGES.map((page) => (
              <label
                key={page.key}
                className="flex items-center gap-2 text-[13px] text-ink"
              >
                <input
                  type="checkbox"
                  name="pages"
                  value={page.key}
                  defaultChecked={member.pages.includes(page.key)}
                  className="h-4 w-4 accent-green"
                />
                <span className="flex w-4 shrink-0 items-center justify-center text-green">
                  {page.icon && <Icon name={page.icon} size={14} />}
                </span>
                {page.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className={btnPrimary + " !px-4 !py-2 !text-[13px]"}
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function TeamManager({ members }: { members: AdminMember[] }) {
  return (
    <div className="grid gap-6">
      <AddAdminForm />
      <Card className="!p-0">
        <div className="border-b border-ink/[0.06] px-5 py-3.5">
          <h2 className="m-0 font-serif text-[16px] font-bold text-ink">
            All admins
          </h2>
        </div>
        <div className="divide-y divide-ink/[0.06]">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </Card>
    </div>
  );
}
