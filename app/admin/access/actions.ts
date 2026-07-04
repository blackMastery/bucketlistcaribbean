"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePageAccess } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { GRANTABLE_KEYS } from "@/lib/admin-pages";
import type { AdminRole } from "@/lib/database.types";

export type TeamFormState = {
  error?: string;
  saved?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const roleSchema = z.enum(["admin", "super_admin"]);

function roleLabel(role: AdminRole): string {
  return role === "super_admin" ? "super admin" : "admin";
}

// Flatten Zod issues to a one-message-per-field map for the form UI.
function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const { fieldErrors } = z.flattenError(error);
  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length) out[field] = String(messages[0]);
  }
  return out;
}

async function activeSuperAdminCount(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);
  return count ?? 0;
}

// Looks like Supabase already has a login for this email → promote, don't recreate.
function isEmailExistsError(error: { code?: string; status?: number; message?: string } | null) {
  if (!error) return false;
  if (error.code === "email_exists") return true;
  if (error.status === 422) return true;
  return /already.*registered|already.*exists/i.test(error.message ?? "");
}

const addSchema = z.object({
  email: z.email("Enter a valid email."),
  full_name: z.string().trim().min(1, "Full name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: roleSchema,
});

export async function addAdmin(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requirePageAccess("access");

  if (!hasServiceRole) {
    return { error: "Service role key is not configured on the server." };
  }

  const parsed = addSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { email, full_name, password, role } = parsed.data;
  const supabase = createAdminClient();

  // Create the auth login. If the email already has one, fall through to promote
  // the existing user without touching their password.
  let wasExisting = false;
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createError) {
    if (isEmailExistsError(createError)) {
      wasExisting = true;
    } else {
      return { error: createError.message };
    }
  }

  const { error: rpcError } = await supabase.rpc("make_admin", {
    p_email: email,
    p_full_name: full_name,
    p_role: role,
  });
  if (rpcError) {
    return { error: rpcError.message };
  }

  revalidatePath("/admin/access");
  return {
    saved: true,
    message: wasExisting
      ? `${email} already had a login — promoted to ${roleLabel(role)}.`
      : `Created a login for ${email} and added them as ${roleLabel(role)}.`,
  };
}

const updateSchema = z.object({
  admin_user_id: z.uuid("Invalid admin id."),
  role: roleSchema,
});

export async function updateMember(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await requirePageAccess("access");

  if (!hasServiceRole) {
    return { error: "Service role key is not configured on the server." };
  }

  const parsed = updateSchema.safeParse({
    admin_user_id: formData.get("admin_user_id"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { admin_user_id, role } = parsed.data;
  const isActive = formData.get("is_active") != null;
  // Only ever persist grants for sections regular admins are allowed to receive.
  const pages = formData
    .getAll("pages")
    .map(String)
    .filter((key) => GRANTABLE_KEYS.has(key));

  const supabase = createAdminClient();

  // Lockout guard: never demote or deactivate the last active super admin.
  if (role !== "super_admin" || !isActive) {
    const { data: target } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("id", admin_user_id)
      .maybeSingle();
    if (target?.role === "super_admin" && target.is_active) {
      const count = await activeSuperAdminCount(supabase);
      if (count <= 1) {
        return {
          error: "You can't demote or deactivate the last active super admin.",
        };
      }
    }
  }

  const { error: updateError } = await supabase
    .from("admin_users")
    .update({ role, is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", admin_user_id);
  if (updateError) {
    return { error: updateError.message };
  }

  // Replace the grant set. Super admins ignore grants entirely.
  const { error: deleteError } = await supabase
    .from("admin_user_pages")
    .delete()
    .eq("admin_user_id", admin_user_id);
  if (deleteError) {
    return { error: deleteError.message };
  }

  if (role !== "super_admin" && pages.length) {
    const { error: insertError } = await supabase
      .from("admin_user_pages")
      .insert(pages.map((page_key) => ({ admin_user_id, page_key })));
    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath("/admin/access");
  return { saved: true, message: "Changes saved." };
}
