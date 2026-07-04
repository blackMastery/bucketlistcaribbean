"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePageAccess } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { sendTestEmail } from "@/lib/email/send";

export type TemplateActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().max(120).optional(),
  subject: z.string().min(1, "Subject is required").max(500),
  body_html: z.string(),
  is_active: z.boolean(),
});

function parseBool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export async function upsertTemplate(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const ctx = await requirePageAccess("email-templates");
  const supabase = await createClient();

  const raw = {
    id: (formData.get("id") as string) || undefined,
    name: (formData.get("name") as string) ?? "",
    slug: (formData.get("slug") as string) || undefined,
    subject: (formData.get("subject") as string) ?? "",
    body_html: (formData.get("body_html") as string) ?? "",
    is_active: parseBool(formData.get("is_active")),
  };

  const parsed = templateSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { id, name, subject, body_html, is_active } = parsed.data;

  if (id) {
    const { data: existing } = await supabase
      .from("email_templates")
      .select("slug, is_system")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { ok: false, message: "Template not found." };
    }

    const row = existing as { slug: string; is_system: boolean };
    const incomingSlug = (parsed.data.slug ?? "").trim();
    if (incomingSlug && incomingSlug !== row.slug) {
      return { ok: false, fieldErrors: { slug: "Slug cannot be changed after creation." } };
    }

    const { error } = await supabase
      .from("email_templates")
      .update({
        name: name.trim(),
        subject: subject.trim(),
        body_html,
        is_active,
        modified_by: ctx.user.id,
      })
      .eq("id", id);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin/email-templates");
    revalidatePath(`/admin/email-templates/${id}/edit`);
    return { ok: true, message: "Saved." };
  }

  let slug = (parsed.data.slug ?? "").trim() || slugify(name);
  if (slug.length > 120) slug = slug.slice(0, 120);

  const { error } = await supabase.from("email_templates").insert({
    slug,
    name: name.trim(),
    subject: subject.trim(),
    body_html,
    is_active,
    is_system: false,
    created_by: ctx.user.id,
    modified_by: ctx.user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { slug: "This slug is already in use." } };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/email-templates");
  redirect("/admin/email-templates");
}

export async function createTemplate(formData: FormData): Promise<void> {
  await upsertTemplate({ ok: true }, formData);
}

export async function deleteTemplate(id: string): Promise<{ ok: boolean; error?: string }> {
  await requirePageAccess("email-templates");
  const supabase = await createClient();

  const { data } = await supabase
    .from("email_templates")
    .select("is_system")
    .eq("id", id)
    .maybeSingle();

  if (!data) return { ok: false, error: "Template not found." };
  if ((data as { is_system: boolean }).is_system) {
    return { ok: false, error: "System templates cannot be deleted." };
  }

  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/email-templates");
  return { ok: true };
}

const testSendSchema = z.object({
  slug: z.string().min(1),
  to: z.string().email("Enter a valid email address"),
});

export type TestSendState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function sendTestTemplate(
  _prev: TestSendState,
  formData: FormData,
): Promise<TestSendState> {
  const ctx = await requirePageAccess("email-templates");

  const parsed = testSendSchema.safeParse({
    slug: formData.get("slug"),
    to: formData.get("to"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const result = await sendTestEmail({
    slug: parsed.data.slug,
    to: parsed.data.to,
    sentBy: ctx.user.id,
  });

  revalidatePath("/admin/email-templates");

  return {
    ok: result.status !== "failed",
    message: result.message,
  };
}
