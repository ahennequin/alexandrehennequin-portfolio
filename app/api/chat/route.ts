import Anthropic from "@anthropic-ai/sdk";
import { embedQuery } from "@/lib/embeddings";
import { retrieve } from "@/lib/qdrant";
import { buildSystemPrompt, buildUserPrompt, formatContext } from "@/lib/prompt";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { isLocale, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.CLAUDE_MODEL ?? "claude-3-5-haiku-latest";
const MAX_HISTORY_TURNS = 6;

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
  );
}

function buildClaudeMessages(
  messages: ChatMessage[],
  finalUserPrompt: string
): ChatMessage[] {
  let history = sanitizeHistory(messages);
  // First turn must be a user message.
  while (history.length > 0 && history[0].role !== "user") history.shift();
  // Keep the most recent turns.
  history = history.slice(-MAX_HISTORY_TURNS);
  // Drop any trailing user turn — it is replaced by the augmented prompt.
  while (history.length > 0 && history[history.length - 1].role === "user") {
    history.pop();
  }
  return [...history, { role: "user", content: finalUserPrompt }];
}

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[]; lang?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lang: Locale = isLocale(body.lang) ? body.lang : "en";
  const rateLimitMessage =
    lang === "fr"
      ? "Trop de requêtes. Veuillez patienter une minute."
      : "Too many requests. Please wait a minute.";

  if (isRateLimited(getClientIp(req.headers))) {
    return new Response(JSON.stringify({ error: rateLimitMessage }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.messages || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const history = sanitizeHistory(body.messages);
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.content ?? "";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const queryVector = await embedQuery(query);
        const hits = await retrieve(queryVector, 5, lang);
        const context = formatContext(hits);
        const userPrompt = buildUserPrompt(query, context);
        const claudeMessages = buildClaudeMessages(history, userPrompt);

        const anthropic = new Anthropic();
        const messageStream = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: 800,
          system: buildSystemPrompt(lang),
          messages: claudeMessages,
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("/api/chat error:", err);
        controller.enqueue(
          encoder.encode(
            lang === "fr"
              ? "\n\n[Une erreur est survenue pendant la réponse — veuillez réessayer.]"
              : "\n\n[Something went wrong while answering — please try again.]"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}