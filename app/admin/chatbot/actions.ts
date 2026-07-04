"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageAccess } from "@/lib/admin";

export type Result = { ok: boolean; error?: string };

export type FaqInput = {
  category_id: string | null;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
};

// The chatbot API reads FAQs fresh on every request (no ISR cache), so only
// the admin section needs revalidating after writes.
function revalidateChatbotAdmin() {
  revalidatePath("/admin/chatbot");
}

export async function createFaq(input: FaqInput): Promise<void> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert(input);
  if (error) throw new Error(error.message);
  revalidateChatbotAdmin();
  redirect("/admin/chatbot");
}

export async function updateFaq(id: string, input: FaqInput): Promise<Result> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateChatbotAdmin();
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<void> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  // chatbot_conversations.matched_faq_id is "on delete set null" — logs survive.
  await supabase.from("faqs").delete().eq("id", id);
  revalidateChatbotAdmin();
  redirect("/admin/chatbot");
}

export async function toggleFaqActive(id: string, isActive: boolean): Promise<Result> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateChatbotAdmin();
  return { ok: true };
}

export async function createFaqCategory(
  name: string,
  sortOrder: number,
): Promise<Result> {
  await requirePageAccess("chatbot");
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Please enter a category name." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("faq_categories")
    .insert({ name: trimmed, sort_order: sortOrder });
  if (error) return { ok: false, error: error.message };
  revalidateChatbotAdmin();
  return { ok: true };
}

export async function deleteFaqCategory(id: string): Promise<Result> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  // faqs.category_id is "on delete set null" — FAQs just become uncategorized.
  const { error } = await supabase.from("faq_categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateChatbotAdmin();
  return { ok: true };
}

export async function deleteConversation(id: string): Promise<Result> {
  await requirePageAccess("chatbot");
  const supabase = await createClient();
  const { error } = await supabase.from("chatbot_conversations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateChatbotAdmin();
  return { ok: true };
}
