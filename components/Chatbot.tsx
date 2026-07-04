"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import type { BusinessContact } from "@/lib/site-content";

type ChatMessage = { role: "user" | "assistant"; content: string };

const LINK_RE = /(\/tours\/[a-z0-9-]+|https?:\/\/[^\s)]+)/g;

// Assistant replies are plain text; only tour paths and full URLs become
// anchors — no HTML or markdown is ever rendered from the model.
function renderWithLinks(text: string) {
  return text.split(LINK_RE).map((part, i) => {
    if (part.startsWith("/tours/")) {
      return (
        <a key={i} href={part} className="font-semibold text-green underline">
          {part}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-green underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Floating customer-service chat: a FAB (same spot the WhatsApp FAB used to
// occupy) toggling a branded panel that talks to /api/chatbot.
export function Chatbot({
  storeName,
  contact,
}: {
  storeName: string;
  contact: BusinessContact;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm the ${storeName} assistant. Ask me about our tours, bookings, payments, or travel prep — or message us on WhatsApp any time.`,
    },
  ]);
  const [finePointer, setFinePointer] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef("");

  // Lock body scroll only on touch devices — desktop users can keep
  // scrolling the page behind the panel.
  useBodyScrollLock(open && coarsePointer);

  useEffect(() => {
    setFinePointer(window.matchMedia("(pointer: fine)").matches);
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Move focus into the dialog on open: the input on fine pointers, the close
  // button on touch (focusing the input would summon the keyboard).
  useEffect(() => {
    if (!open) return;
    if (finePointer) inputRef.current?.focus();
    else closeRef.current?.focus();
  }, [open, finePointer]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, sending, open, reducedMotion]);

  function getSessionId(): string {
    if (sessionRef.current) return sessionRef.current;
    let id = "";
    try {
      id = localStorage.getItem("mc-chat-session") ?? "";
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("mc-chat-session", id);
      }
    } catch {
      id = crypto.randomUUID();
    }
    sessionRef.current = id;
    return id;
  }

  function close() {
    setOpen(false);
    fabRef.current?.focus();
  }

  function onPanelKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, session_id: getSessionId() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: { reply: string } = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Sorry — something went wrong on our end. Please try again in a moment, or tap the WhatsApp link at the top of this chat and our concierge team will take care of you. You can also call ${contact.phone}.`,
        },
      ]);
    } finally {
      setSending(false);
      if (finePointer) inputRef.current?.focus();
    }
  }

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Chat with ${storeName}`}
        className={`fixed bottom-[max(26px,env(safe-area-inset-bottom))] right-[max(26px,env(safe-area-inset-right))] z-[900] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-green transition-colors hover:bg-green-dark ${focusRing}`}
        style={open || reducedMotion ? undefined : { animation: "mcPulse 2.6s ease-in-out infinite" }}
      >
        <Icon name={open ? "x" : "message-circle"} size={26} className="text-sand" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={`Chat with ${storeName}`}
          onKeyDown={onPanelKeyDown}
          className="fixed bottom-[calc(max(26px,env(safe-area-inset-bottom))+76px)] right-[max(16px,env(safe-area-inset-right))] z-[2000] flex h-[min(32rem,calc(100dvh-10rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_16px_48px_rgba(0,0,0,0.25)] sm:w-[22rem]"
        >
          <div className="flex items-center justify-between gap-3 bg-night px-4 py-3">
            <div>
              <p className="font-serif text-[16px] font-semibold text-sand">{storeName}</p>
              <a
                href={contact.whatsapp_href}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-sans text-[11px] font-semibold text-gold-light underline ${focusRing}`}
              >
                {contact.whatsapp_short_label}
              </a>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close chat"
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sand transition-colors hover:bg-night-soft ${focusRing}`}
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 font-body text-[14px] leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto rounded-br-md bg-green text-sand"
                    : "mr-auto rounded-bl-md bg-white text-ink shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                }`}
              >
                {msg.role === "assistant" ? renderWithLinks(msg.content) : msg.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                <span className="sr-only">Assistant is typing…</span>
                <span aria-hidden="true" className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className={`h-1.5 w-1.5 rounded-full bg-muted ${reducedMotion ? "" : "animate-bounce"}`}
                      style={reducedMotion ? undefined : { animationDelay: `${dot * 150}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-cream-deep bg-cream px-3 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              maxLength={2000}
              aria-label="Type your message"
              placeholder="Ask about tours, bookings…"
              className="min-w-0 flex-1 rounded-full border-[1.5px] border-cream-deep bg-white px-4 py-2.5 font-body text-[14px] text-ink outline-none placeholder:text-muted-light focus:border-green disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green text-sand transition-colors hover:bg-green-dark disabled:opacity-50 ${focusRing}`}
            >
              <Icon name="send" size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
