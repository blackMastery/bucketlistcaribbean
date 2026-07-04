import "server-only";
import OpenAI from "openai";
import { createStaticClient } from "@/lib/supabase/static";
import { getSiteContent } from "@/lib/queries";
import {
  resolveBlock,
  DEFAULT_BUSINESS_CONTACT,
  type BusinessContact,
} from "@/lib/site-content";
import { getSeoConfig } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import {
  isHoursQuestion,
  tokenize,
  bestFaqMatch,
  FAQ_THRESHOLD,
} from "@/lib/ai/chatbot-rules";
import type { TourSearchResult } from "@/lib/database.types";

// Three-tier answer pipeline, cheapest first: deterministic rules -> FAQ
// keyword match -> LLM with retrieved tour context -> static fallback.
// Everything runs under the anon key: FAQs are public-read, conversation
// logging is insert-open, and the RPCs are security definer (0015_chatbot.sql).

export type ChatbotSource = "rules" | "faq" | "llm" | "fallback";

export type ChatbotAnswer = {
  reply: string;
  matchedFaqId: string | null;
  confidence: number | null;
  source: ChatbotSource;
};

type FaqContext = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  usage_count: number;
};

const TIMEZONE = "America/Guyana";
// Drop search_tours rows scoring below this before they reach the LLM prompt.
const TOUR_SCORE_FLOOR = 0.12;

export async function answerMessage(message: string): Promise<ChatbotAnswer> {
  const [biz, site] = await Promise.all([loadBusinessContact(), getSeoConfig()]);

  // Tier 1 — deterministic: hours/schedule questions answer straight from the
  // live settings. "Are you open right now?" phrasings fall through to the
  // LLM, which gets the current local time (see isHoursQuestion).
  if (isHoursQuestion(message)) {
    const hours = biz.hours
      .split("\n")
      .map((line) => `• ${line.trim()}`)
      .join("\n");
    return {
      reply: `Our hours of operation:\n${hours}\n\nYou can also reach us on WhatsApp any time — we respond as soon as we're back.`,
      matchedFaqId: null,
      confidence: 1,
      source: "rules",
    };
  }

  // Tier 2 — FAQ keyword match: verbatim answer when the score clears the bar.
  const faqs = await loadFaqs();
  const match = bestFaqMatch(message, faqs);
  if (match && match.confidence >= FAQ_THRESHOLD) {
    void incrementFaqUsage(match.faq.id);
    return {
      reply: match.faq.answer,
      matchedFaqId: match.faq.id,
      confidence: Number(match.confidence.toFixed(2)),
      source: "faq",
    };
  }

  // Tier 3 — LLM with retrieved context.
  const tours = await searchTours(message);
  const reply = await callOpenAI(buildSystemPrompt(site.name, biz, faqs, tours), message);
  if (reply) {
    return { reply, matchedFaqId: null, confidence: null, source: "llm" };
  }

  // Tier 4 — static branded fallback (no key configured or the call failed).
  return {
    reply: `I'm not able to answer that one right now — but our concierge team is! Message us on WhatsApp (${biz.whatsapp_href}) or call ${biz.phone} and we'll take care of you.`,
    matchedFaqId: null,
    confidence: null,
    source: "fallback",
  };
}

export async function logConversation(entry: {
  session_id: string;
  user_message: string;
  bot_response: string;
  matched_faq_id: string | null;
  confidence_score: number | null;
}): Promise<void> {
  try {
    const supabase = createStaticClient();
    const { error } = await supabase.from("chatbot_conversations").insert(entry);
    if (error) console.error("[chatbot] log insert failed:", error.message);
  } catch (err) {
    console.error("[chatbot] log failed:", err);
  }
}

// --- Data loading (each guarded so an unapplied migration or a Supabase
// outage degrades the pipeline instead of breaking it) ----------------------

async function loadBusinessContact(): Promise<BusinessContact> {
  try {
    const content = await getSiteContent();
    return resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);
  } catch {
    return DEFAULT_BUSINESS_CONTACT;
  }
}

async function loadFaqs(): Promise<FaqContext[]> {
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("faqs")
      .select("id, question, answer, keywords, usage_count")
      .eq("is_active", true);
    return data ?? [];
  } catch {
    return [];
  }
}

async function searchTours(message: string): Promise<TourSearchResult[]> {
  const q = tokenize(message).join(" ");
  if (!q) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.rpc("search_tours", { q, max_rows: 5 });
    return (data ?? []).filter((t) => t.score >= TOUR_SCORE_FLOOR);
  } catch {
    return [];
  }
}

// supabase-js builders only execute once awaited — this async wrapper runs the
// RPC when called fire-and-forget, and never lets a failure surface.
async function incrementFaqUsage(faqId: string): Promise<void> {
  try {
    const supabase = createStaticClient();
    const { error } = await supabase.rpc("increment_faq_usage", { p_faq_id: faqId });
    if (error) console.error("[chatbot] usage increment failed:", error.message);
  } catch (err) {
    console.error("[chatbot] usage increment failed:", err);
  }
}

// --- LLM tier ---------------------------------------------------------------

function buildSystemPrompt(
  siteName: string,
  biz: BusinessContact,
  faqs: FaqContext[],
  tours: TourSearchResult[],
): string {
  const now = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const faqBlock = faqs
    .slice()
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 20)
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const tourBlock = tours
    .map(
      (t) =>
        `- ${t.title} — ${t.location} — ${formatPrice(t.price_cents)} — ${t.duration_label} — /tours/${t.slug} — ${t.overview_snippet}`,
    )
    .join("\n");

  return `You are the customer-service assistant for ${siteName}, a Guyanese Caribbean travel company.

Current local date and time: ${now} (${TIMEZONE}).
Hours of operation (display text — reason from it together with the current time for "are you open now?" questions):
${biz.hours}

Rules:
- Be concise: 1–3 sentences.
- Reply in plain text only — no markdown syntax. Write links as bare paths or URLs (the chat window makes them clickable).
- All prices are in Guyanese dollars (GYD). Only quote prices given in the context below, formatted exactly as provided (e.g. "$265,000 GYD").
- When a question matches an FAQ below, quote that answer rather than paraphrasing the policy.
- When relevant, recommend 1–3 of the matched tours below using their relative links (e.g. /tours/the-slug). Never invent tours, prices, availability, or policies.
- If you are unsure or the question needs a human, direct the visitor to WhatsApp (${biz.whatsapp_href}) or phone (${biz.phone}).

Frequently asked questions:
${faqBlock || "(none available)"}

Tours matching this enquiry:
${tourBlock || "(no close matches — do not recommend specific tours)"}`;
}

async function callOpenAI(system: string, message: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    // Constructed inside the guard — the constructor throws without a key.
    const client = new OpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.error("[chatbot] OpenAI call failed:", err);
    return null;
  }
}
