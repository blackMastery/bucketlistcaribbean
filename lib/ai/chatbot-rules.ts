// Pure tier-1/tier-2 logic for the customer-service chatbot: the deterministic
// hours-question detector and the FAQ keyword-overlap scorer. Kept free of
// server-only and Supabase imports so vitest can exercise it directly
// (lib/ai/chatbot.ts imports "server-only", which throws under Node tests).

// Questions about hours/schedule in general — answered deterministically from
// the live business_contact settings, never by the LLM or a stale FAQ.
const HOURS_RE =
  /\b(?:hours|opening times?|schedule)\b|\b(?:what time|when) (?:do|does|are|is) (?:you|the (?:office|store|shop|team)) (?:open|close|opening|closing)\b/i;

// "Are you open right now?" phrasings need reasoning against today's date and
// time, so they are excluded from the deterministic rule and handled by the
// LLM, whose system prompt carries the current Guyana time plus the hours text.
const OPEN_NOW_RE =
  /\b(?:open|closed?)\b.{0,40}\b(?:right now|now|currently|at the moment|today|tonight)\b|\b(?:right now|currently|at the moment)\b.{0,40}\b(?:open|closed?)\b|\bare you (?:open|closed)\b/i;

export function isHoursQuestion(message: string): boolean {
  return HOURS_RE.test(message) && !OPEN_NOW_RE.test(message);
}

const STOPWORDS = new Set([
  "the", "and", "are", "for", "you", "your", "our", "can", "how", "what",
  "when", "where", "who", "why", "does", "did", "with", "that", "this",
  "have", "has", "was", "were", "will", "would", "could", "should", "about",
  "any", "get", "its", "not", "but", "all", "out", "there", "here", "just",
  "please", "tell",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^['-]+|['-]+$/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export type ScorableFaq = { question: string; keywords: string[] };

// Keyword-overlap score in [0, 1]: distinct message tokens are counted against
// the FAQ's curated keywords (double weight) and its question tokens, then
// normalized by the distinct token count. The floor of 3 keeps one- or
// two-word messages from trivially scoring 1.0 on a single question-word hit.
export function scoreFaq(messageTokens: string[], faq: ScorableFaq): number {
  const distinct = new Set(messageTokens);
  if (distinct.size === 0) return 0;
  const keywordSet = new Set(faq.keywords.map((k) => k.toLowerCase()));
  const questionSet = new Set(tokenize(faq.question));
  let hits = 0;
  for (const token of distinct) {
    if (keywordSet.has(token)) hits += 2;
    else if (questionSet.has(token)) hits += 1;
  }
  return Math.min(1, hits / Math.max(3, distinct.size));
}

// Answer the FAQ verbatim at or above this score; below it, fall through to
// the LLM tier.
export const FAQ_THRESHOLD = 0.55;

export function bestFaqMatch<T extends ScorableFaq>(
  message: string,
  faqs: T[],
): { faq: T; confidence: number } | null {
  const tokens = tokenize(message);
  let best: { faq: T; confidence: number } | null = null;
  for (const faq of faqs) {
    const confidence = scoreFaq(tokens, faq);
    if (!best || confidence > best.confidence) best = { faq, confidence };
  }
  return best;
}
