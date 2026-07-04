import { NextResponse, after } from "next/server";
import { answerMessage, logConversation } from "@/lib/ai/chatbot";
import { chatbotRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

// Per-IP sliding-window rate limit: 20 requests per 60s. In-process only —
// resets on redeploy/HMR and is not shared across instances; swap for
// Upstash/Redis when running multiple instances.
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic sweep so idle IPs don't accumulate forever.
  if (hits.size > 500) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = chatbotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const answer = await answerMessage(parsed.data.message);

    // Best-effort logging after the response is sent; failures are swallowed
    // inside logConversation and must never affect the reply.
    after(() =>
      logConversation({
        session_id: parsed.data.session_id,
        user_message: parsed.data.message,
        bot_response: answer.reply,
        matched_faq_id: answer.matchedFaqId,
        confidence_score: answer.confidence,
      }),
    );

    return NextResponse.json({ reply: answer.reply, source: answer.source });
  } catch (err) {
    console.error("[chatbot] answer failed:", err);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again." },
      { status: 500 },
    );
  }
}
