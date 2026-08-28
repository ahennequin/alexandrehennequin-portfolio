import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { isLocale, type Locale } from "@/lib/i18n";
import { streamAnswer, type ChatMessage } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 30;

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
    return new Response(JSON.stringify({ error: "Server is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = body.messages;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAnswer({ messages, lang })) {
          controller.enqueue(encoder.encode(chunk));
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
