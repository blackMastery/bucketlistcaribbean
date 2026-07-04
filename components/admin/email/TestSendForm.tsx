"use client";

import { useActionState } from "react";
import {
  sendTestTemplate,
  type TestSendState,
} from "@/app/admin/email-templates/actions";
import { btnPrimary, inputCls, FormLabel, Card } from "@/components/admin/ui";

const initialState: TestSendState = { ok: false };

export function TestSendForm({
  slug,
  defaultTo,
}: {
  slug: string;
  defaultTo?: string;
}) {
  const [state, formAction, pending] = useActionState(sendTestTemplate, initialState);

  return (
    <Card>
      <h2 className="m-0 mb-1 font-serif text-[18px] font-semibold text-ink">Send test email</h2>
      <p className="m-0 mb-4 text-[13px] text-muted">
        Sends the <strong>saved</strong> template (not unsaved draft changes) with sample data and live branding.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="slug" value={slug} />
        <div>
          <FormLabel htmlFor="test-to" required>
            Recipient email
          </FormLabel>
          <input
            id="test-to"
            name="to"
            type="email"
            className={inputCls}
            defaultValue={defaultTo ?? ""}
            placeholder="you@example.com"
            required
          />
          {state.fieldErrors?.to && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.to}</p>
          )}
        </div>

        {state.message && (
          <p className={`m-0 text-[13px] ${state.ok ? "text-green" : "text-coral"}`}>
            {state.message}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" className={btnPrimary} disabled={pending}>
            {pending ? "Sending…" : "Send test"}
          </button>
        </div>
      </form>
    </Card>
  );
}
