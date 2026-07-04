import { describe, it, expect } from "vitest";
import {
  isHoursQuestion,
  tokenize,
  scoreFaq,
  bestFaqMatch,
  FAQ_THRESHOLD,
} from "@/lib/ai/chatbot-rules";

describe("isHoursQuestion", () => {
  it("matches general hours questions", () => {
    expect(isHoursQuestion("What are your hours?")).toBe(true);
    expect(isHoursQuestion("what are your opening hours")).toBe(true);
    expect(isHoursQuestion("hours of operation please")).toBe(true);
    expect(isHoursQuestion("What is your schedule?")).toBe(true);
    expect(isHoursQuestion("When do you open?")).toBe(true);
    expect(isHoursQuestion("what time do you close")).toBe(true);
  });

  it("excludes open-right-now phrasings (those go to the LLM)", () => {
    expect(isHoursQuestion("are you open right now?")).toBe(false);
    expect(isHoursQuestion("Are you currently open?")).toBe(false);
    expect(isHoursQuestion("are you open?")).toBe(false);
    expect(isHoursQuestion("are you open today")).toBe(false);
  });

  it("ignores unrelated questions", () => {
    expect(isHoursQuestion("How do I book a tour?")).toBe(false);
    expect(isHoursQuestion("is the office open today")).toBe(false);
    expect(isHoursQuestion("do you have open spots on the St. Lucia tour")).toBe(false);
  });
});

describe("tokenize", () => {
  it("lowercases, strips punctuation, and drops stopwords and short tokens", () => {
    expect(tokenize("Do I need a passport for the tour?")).toEqual([
      "need",
      "passport",
      "tour",
    ]);
  });

  it("returns an empty array for stopword-only input", () => {
    expect(tokenize("can you tell (about it)?")).toEqual([]);
  });
});

describe("scoreFaq", () => {
  const faq = {
    question: "Do I need a passport or visa to travel?",
    keywords: ["passport", "visa", "documents"],
  };

  it("scores a close match at or above the threshold", () => {
    const score = scoreFaq(tokenize("do i need a passport for the tour?"), faq);
    expect(score).toBeGreaterThanOrEqual(FAQ_THRESHOLD);
  });

  it("weights curated keywords above question-token hits", () => {
    const keywordHit = scoreFaq(["visa", "aaa", "bbb"], faq);
    const questionHit = scoreFaq(["travel", "aaa", "bbb"], faq);
    expect(keywordHit).toBeGreaterThan(questionHit);
  });

  it("scores an unrelated message below the threshold", () => {
    const score = scoreFaq(tokenize("recommend a romantic island getaway"), faq);
    expect(score).toBeLessThan(FAQ_THRESHOLD);
  });

  it("clamps to [0, 1] and floors the denominator for short messages", () => {
    expect(scoreFaq(["passport"], faq)).toBeCloseTo(2 / 3);
    expect(scoreFaq(["passport", "visa", "documents"], faq)).toBe(1);
    expect(scoreFaq([], faq)).toBe(0);
  });
});

describe("bestFaqMatch", () => {
  const faqs = [
    {
      id: "1",
      question: "How do I book a tour?",
      keywords: ["book", "booking", "reserve"],
    },
    {
      id: "2",
      question: "Do I need a passport or visa to travel?",
      keywords: ["passport", "visa", "documents"],
    },
  ];

  it("returns the highest-scoring FAQ", () => {
    const match = bestFaqMatch("how do i book a tour", faqs);
    expect(match?.faq.id).toBe("1");
    expect(match?.confidence).toBeGreaterThanOrEqual(FAQ_THRESHOLD);
  });

  it("returns low confidence for an unrelated message", () => {
    const match = bestFaqMatch("what's the weather like in the islands", faqs);
    expect(match?.confidence).toBeLessThan(FAQ_THRESHOLD);
  });

  it("returns null when there are no FAQs", () => {
    expect(bestFaqMatch("anything", [])).toBeNull();
  });
});
