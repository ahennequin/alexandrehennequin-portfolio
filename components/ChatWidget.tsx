"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMessages, type Locale } from "@/lib/i18n";

type ChatMessage = { role: "user" | "assistant"; content: string };

// Assistant replies come back as Markdown. Render a safe subset (react-markdown
// ignores raw HTML by default) with spacing/list styles scoped to this bubble via
// Tailwind arbitrary-child variants, so no typography plugin is needed.
function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div
      className="space-y-2 [&_a]:text-signal [&_a]:underline [&_code]:rounded [&_code]:bg-graphite/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-graphite/15 [&_pre]:p-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// Shown in the assistant bubble while the model is processing and hasn't
// streamed its first token yet: three dots bouncing in sequence.
function ThinkingDots() {
  return (
    <span
      className="inline-flex items-center gap-1 py-1 align-middle [&>span]:h-1.5 [&>span]:w-1.5 [&>span]:rounded-full [&>span]:bg-signal"
      role="status"
      aria-label="Assistant is thinking"
    >
      {/* Inline delay so it wins over the `animation` shorthand's own delay. */}
      <span className="animate-bounce-dot" style={{ animationDelay: "-0.32s" }} />
      <span className="animate-bounce-dot" style={{ animationDelay: "-0.16s" }} />
      <span className="animate-bounce-dot" />
    </span>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/fr") ? "fr" : "en";
  const t = getMessages(locale);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: t.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ChatWidget lives in the shared root layout, so switching language client-side
  // doesn't remount it and the greeting captured in useState stays in the old
  // locale. Re-localize it here, but only while the conversation is still just
  // that greeting — never rewrite an exchange the visitor has already started.
  // This syncs React state to the URL-derived locale, an external system, and
  // must keep any in-progress conversation intact, so it can't move into render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ role: "assistant", content: t.chat.greeting }]
        : prev
    );
  }, [t.chat.greeting]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || streaming) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    // Add the user turn AND an empty assistant turn up front. The empty bubble
    // renders <ThinkingDots /> immediately, so the loader is visible for the
    // whole wait before the first token — the response can be buffered for
    // several seconds. The stream then fills this same bubble in place.
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const setAssistant = (updater: (current: string) => string) =>
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: updater(last.content) };
        }
        return copy;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, lang: locale }),
      });

      if (!res.ok) {
        let detail = t.chat.error;
        try {
          const data = await res.json();
          if (data?.error) detail = data.error;
        } catch {
          // ignore, fall back to generic message
        }
        setAssistant(() => detail);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setAssistant(() => t.chat.networkError);
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAssistant((current) => current + chunk);
      }
    } catch {
      setAssistant((current) => current || t.chat.networkError);
    } finally {
      setStreaming(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <section
        className={`fixed bottom-4 right-4 z-50 flex flex-col border border-graphite/25 bg-paper shadow-xl transition-transform sm:bottom-6 sm:right-6 ${
          open
            ? "translate-y-0"
            : "pointer-events-none translate-y-[110%] opacity-0"
        } h-[min(32rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-md`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-graphite/20 px-4 py-3">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-signal">
              {t.chat.title}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-graphite">
              {t.chat.subtitle}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center text-graphite transition-colors hover:text-ink"
            aria-label={t.chat.close}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "whitespace-pre-wrap bg-signal text-paper"
                    : "border border-graphite/20 bg-transparent text-ink"
                }`}
              >
                {message.role === "assistant" ? (
                  message.content ? (
                    <AssistantMarkdown content={message.content} />
                  ) : (
                    streaming &&
                    i === messages.length - 1 && <ThinkingDots />
                  )
                ) : (
                  message.content
                )}
                {streaming &&
                  message.role === "assistant" &&
                  message.content &&
                  i === messages.length - 1 && (
                    <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-signal align-middle" />
                  )}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {t.chat.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="border border-graphite/30 px-2.5 py-1 font-mono text-[11px] text-graphite transition-colors hover:border-signal hover:text-signal"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={submit} className="border-t border-graphite/20 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resizeTextarea();
              }}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={t.chat.placeholder}
              className="max-h-40 flex-1 resize-none border border-graphite/30 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-graphite focus:border-signal focus:outline-none"
            />
            <button
              type="submit"
              disabled={streaming || input.trim().length === 0}
              className="border border-signal px-3 py-2 font-mono text-xs font-medium text-signal transition-colors hover:bg-signal hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.chat.send}
            </button>
          </div>
        </form>
      </section>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 border border-signal bg-signal px-4 py-3 font-mono text-xs font-medium uppercase tracking-[0.15em] text-paper transition-colors hover:bg-transparent hover:text-signal sm:bottom-6 sm:right-6"
          aria-label={t.chat.title}
        >
          {t.chat.ask}
        </button>
      )}
    </>
  );
}
