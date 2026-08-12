"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getMessages, type Locale } from "@/lib/i18n";

type ChatMessage = { role: "user" | "assistant"; content: string };

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

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || streaming) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

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
        setMessages((prev) => [...prev, { role: "assistant", content: detail }]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.chat.networkError },
      ]);
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
            className="px-2 py-1 font-mono text-xs text-graphite hover:text-ink"
            aria-label={t.chat.close}
          >
            {t.chat.close}
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
                className={`max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-signal text-paper"
                    : "border border-graphite/20 bg-transparent text-ink"
                }`}
              >
                {message.content}
                {streaming &&
                  message.role === "assistant" &&
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

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 border border-signal bg-signal px-4 py-3 font-mono text-xs font-medium uppercase tracking-[0.15em] text-paper transition-colors hover:bg-transparent hover:text-signal sm:bottom-6 sm:right-6"
        aria-label={t.chat.title}
      >
        {open ? t.chat.close : t.chat.ask}
      </button>
    </>
  );
}
