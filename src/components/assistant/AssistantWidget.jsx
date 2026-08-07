import React, { useEffect, useRef, useState } from "react";

import { assistant } from "../../lib/api/endpoints.js";
import { LoadingDots } from "../ui/index.js";

const DISMISSED_KEY = "myscholy-assistant-dismissed";
const AUTO_OPENED_KEY = "myscholy-assistant-auto-opened";
const AUTO_OPEN_DELAY_MS = 5000;

const GREETING = {
  role: "model",
  text: "Hello! I am the MyScholy assistant. Ask me anything about scholarships on the site — by country, degree level or deadline — or about how MyScholy works.",
};

/**
 * Floating site assistant, backed by /api/assistant/ on the Django side (the
 * Gemini key never reaches the browser).
 *
 * Renders nothing at all until the backend reports the assistant is
 * configured, so environments without a key - local dev, the e2e stack - are
 * untouched. Auto-opens once per browser after a short delay; closing it is
 * remembered so returning visitors are never nagged.
 */
export default function AssistantWidget() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    assistant
      .status()
      .then((data) => {
        if (!cancelled && data?.enabled) setEnabled(true);
      })
      .catch(() => {
        /* backend unreachable - keep the widget hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // First visit only: pop open once, a few seconds after the page settles.
  useEffect(() => {
    if (!enabled) return undefined;
    if (localStorage.getItem(DISMISSED_KEY)) return undefined;
    if (sessionStorage.getItem(AUTO_OPENED_KEY)) return undefined;

    const timer = setTimeout(() => {
      sessionStorage.setItem(AUTO_OPENED_KEY, "1");
      setOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (open) {
      const pane = scrollRef.current;
      if (pane) pane.scrollTop = pane.scrollHeight;
      inputRef.current?.focus();
    }
  }, [open, messages, sending]);

  if (!enabled) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const history = messages
      .filter((m) => !m.error)
      .slice(-10)
      .map(({ role, text: t }) => ({ role, text: t }));

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const data = await assistant.chat(text, history);
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          error: true,
          text:
            error?.message ||
            "Something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="MyScholy assistant"
          className="flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card-hover"
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-gold-500 bg-brand-900 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">MyScholy Assistant</p>
              <p className="text-xs text-brand-100">
                Ask about scholarships or the site
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-brand-100 transition-colors hover:bg-brand-800 hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex h-80 flex-col gap-2 overflow-y-auto bg-ink-50 p-3"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-8 self-end rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-sm text-white"
                    : message.error
                      ? "mr-8 self-start rounded-2xl rounded-bl-md border border-ink-200 bg-white px-3.5 py-2 text-sm italic text-ink-500"
                      : "mr-8 self-start whitespace-pre-wrap rounded-2xl rounded-bl-md border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-700"
                }
              >
                {message.text}
              </div>
            ))}
            {sending && (
              <div className="mr-8 self-start rounded-2xl rounded-bl-md border border-ink-200 bg-white px-3.5 py-2">
                <LoadingDots />
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-ink-200 bg-white p-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question…"
              maxLength={1000}
              className="max-h-24 flex-1 resize-none rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || sending}
              aria-label="Send"
              className="rounded-xl bg-brand-900 p-2.5 text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Minimise assistant" : "Open MyScholy assistant"}
        className="rounded-full border-2 border-gold-500 bg-brand-900 p-3.5 text-white shadow-card transition-transform hover:scale-105"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-6 w-6">
            <path
              fillRule="evenodd"
              d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832 6.29 12.77a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z"
              clipRule="evenodd"
              transform="rotate(180 10 10)"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-6 w-6">
            <path
              fillRule="evenodd"
              d="M10 2c-4.31 0-8 3.033-8 7 0 2.024.978 3.825 2.499 5.085a3.478 3.478 0 0 1-.522 1.756.75.75 0 0 0 .584 1.143 5.976 5.976 0 0 0 3.936-1.108c.487.082.99.124 1.503.124 4.31 0 8-3.033 8-7s-3.69-7-8-7Zm-3.25 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4.25-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm2.25 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
