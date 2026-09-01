import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { embedQuery } from "@/lib/embeddings";
import { retrieve, type RetrievalHit } from "@/lib/qdrant";
import { buildSystemPrompt, buildUserPrompt, formatContext } from "@/lib/prompt";
import type { ChunkPayload } from "@/lib/vectorIndex";
import type { Locale } from "@/lib/i18n";

// Canonical chat-message shape. Shared by the HTTP route and this module;
// ChatWidget keeps its own structural copy on the client.
export type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
const MAX_HISTORY_TURNS = 6;
const TOP_K = 5;

// ── Model seam ──────────────────────────────────────────────────────────────
// `ChatModel` is a deliberately tiny interface over "given a system prompt and
// a message list, stream back answer text". The real adapter (`geminiModel`)
// wraps `GoogleGenAI().models.generateContentStream(...)`; a test can pass a
// recorded fake that replays captured deltas with no API key or network. One
// real adapter plus that hypothetical test adapter is the whole justification
// for the seam — no test framework is pulled in here.
export type ChatModel = (args: {
  system: string;
  messages: ChatMessage[];
}) => AsyncIterable<string>;

export type AnswerDeps = {
  embed: (query: string) => Promise<number[]>;
  retrieve: (
    vector: number[],
    topK: number,
    lang: Locale
  ) => Promise<RetrievalHit<ChunkPayload>[]>;
  model: ChatModel;
};

async function* geminiModel(args: {
  system: string;
  messages: ChatMessage[];
}): AsyncGenerator<string> {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stream = await genai.models.generateContentStream({
    model: MODEL,
    // Gemini uses "model" for the assistant role and `parts` for content.
    contents: args.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: args.system,
      maxOutputTokens: 800,
      // Grounded Q&A over a tiny knowledge base doesn't need deep reasoning.
      // Gemini 3 can't switch "thinking" off entirely, but the lowest level
      // keeps the pre-answer pause short; the loop below drops thought parts so
      // the model's scratchpad never reaches the user.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  for await (const chunk of stream) {
    // Skip any "thought" parts defensively — only stream the visible answer.
    const parts = chunk.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.text && !part.thought) yield part.text;
    }
  }
}

export const defaultDeps: AnswerDeps = {
  embed: embedQuery,
  retrieve: (vector, topK, lang) => retrieve<ChunkPayload>(vector, topK, lang),
  model: geminiModel,
};

function sanitizeHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0
  );
}

function latestUserQuery(history: ChatMessage[]): string {
  return [...history].reverse().find((m) => m.role === "user")?.content ?? "";
}

function buildModelMessages(
  history: ChatMessage[],
  finalUserPrompt: string
): ChatMessage[] {
  let turns = [...history];
  // First turn must be a user message.
  while (turns.length > 0 && turns[0].role !== "user") turns.shift();
  // Keep the most recent turns.
  turns = turns.slice(-MAX_HISTORY_TURNS);
  // Drop any trailing user turn — it is replaced by the augmented prompt.
  while (turns.length > 0 && turns[turns.length - 1].role === "user") {
    turns.pop();
  }
  return [...turns, { role: "user", content: finalUserPrompt }];
}

/**
 * The RAG answer pipeline as one deep module: take the raw client message list,
 * sanitize it, then embed → retrieve → format context → build prompts →
 * assemble model messages → stream the model call. The query is the latest
 * user turn, so callers pass the whole conversation and nothing else. Yields
 * answer text chunks (token deltas) and nothing else.
 */
export async function* streamAnswer(
  input: { messages: ChatMessage[]; lang: Locale },
  deps: AnswerDeps = defaultDeps
): AsyncGenerator<string> {
  const { lang } = input;
  const history = sanitizeHistory(input.messages);
  const query = latestUserQuery(history);

  const queryVector = await deps.embed(query);
  const hits = await deps.retrieve(queryVector, TOP_K, lang);
  const context = formatContext(hits);
  const userPrompt = buildUserPrompt(query, context);
  const modelMessages = buildModelMessages(history, userPrompt);
  const system = buildSystemPrompt(lang);

  for await (const chunk of deps.model({ system, messages: modelMessages })) {
    yield chunk;
  }
}
