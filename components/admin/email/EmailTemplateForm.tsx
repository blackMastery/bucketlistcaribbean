"use client";

import { useActionState, useState } from "react";
import {
  upsertTemplate,
  createTemplate,
  type TemplateActionState,
} from "@/app/admin/email-templates/actions";
import { EmailHtmlEditor } from "@/components/admin/email/EmailHtmlEditor";
import {
  btnPrimary,
  inputCls,
  FormLabel,
  FormRequiredNote,
  Card,
} from "@/components/admin/ui";
import { slugify } from "@/lib/format";
import type { EmailBrand } from "@/lib/email/render";
import type { EmailTemplateRow } from "@/lib/database.types";

const initialState: TemplateActionState = { ok: false };

type EmailTemplateFormProps = {
  mode: "new" | "edit";
  template?: EmailTemplateRow;
  brand: EmailBrand;
};

export function EmailTemplateForm({ mode, template, brand }: EmailTemplateFormProps) {
  const [state, formAction, pending] = useActionState(upsertTemplate, initialState);

  const [name, setName] = useState(template?.name ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  function handleNameChange(value: string) {
    setName(value);
    if (mode === "new" && !slugTouched) {
      setSlug(slugify(value).slice(0, 120));
    }
  }

  const formFields = (
    <>
      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <div>
          <FormLabel htmlFor="name" required>
            Name
          </FormLabel>
          <input
            id="name"
            name="name"
            className={inputCls}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.name}</p>
          )}
        </div>
        <div>
          <FormLabel htmlFor="slug" required>
            Slug
          </FormLabel>
          <input
            id="slug"
            name="slug"
            className={`${inputCls} ${mode === "edit" ? "bg-sand/50 text-muted" : ""}`}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            readOnly={mode === "edit"}
            required
          />
          {mode === "edit" && (
            <p className="mt-1 text-[12px] text-muted">Slug is fixed after creation.</p>
          )}
          {state.fieldErrors?.slug && (
            <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.slug}</p>
          )}
        </div>
      </div>

      <div>
        <FormLabel htmlFor="subject" required>
          Subject
        </FormLabel>
        <input
          id="subject"
          name="subject"
          className={inputCls}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <p className="mt-1 text-[12px] text-muted">
          Supports {"{{variable}}"} placeholders.
        </p>
        {state.fieldErrors?.subject && (
          <p className="mt-1 text-[12px] text-coral">{state.fieldErrors.subject}</p>
        )}
      </div>

      <div>
        <FormLabel>Body</FormLabel>
        <EmailHtmlEditor
          name="body_html"
          defaultValue={template?.body_html ?? ""}
          subject={subject}
          brand={brand}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={template?.is_active ?? true}
          className="h-4 w-4 accent-green"
        />
        <span className="font-sans text-[14px] text-ink">Active (emails will send when triggered)</span>
      </label>

      {template?.is_system && (
        <p className="m-0 rounded-lg bg-sand/60 px-4 py-3 text-[13px] text-muted">
          This is a system template used for automated booking emails. You can edit the content, but it cannot be deleted and its slug cannot change.
        </p>
      )}

      {!template?.is_system && mode === "edit" && template?.slug === "welcome" && (
        <p className="m-0 text-[13px] text-muted">
          The welcome template is not wired to any flow yet — it is available for future use.
        </p>
      )}

      {state.message && !state.ok && (
        <p className="m-0 text-[13px] text-coral">{state.message}</p>
      )}
      {state.ok && state.message && (
        <p className="m-0 text-[13px] text-green">{state.message}</p>
      )}

      <FormRequiredNote />

      <div>
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Saving…" : mode === "new" ? "Create template" : "Save changes"}
        </button>
      </div>
    </>
  );

  if (mode === "new") {
    return (
      <Card>
        <form action={createTemplate} className="flex flex-col gap-5">
          {formFields}
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-5">
        {formFields}
      </form>
    </Card>
  );
}
