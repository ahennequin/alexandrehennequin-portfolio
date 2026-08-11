import { VoyageAIClient } from "voyageai";

export const EMBEDDING_MODEL = "voyage-4";
export const EMBEDDING_DIMENSION = 1024;

let client: VoyageAIClient | null = null;

export function getVoyageClient(): VoyageAIClient {
  if (!process.env.VOYAGEAI_API_KEY) {
    throw new Error("VOYAGEAI_API_KEY is not set");
  }
  if (!client) {
    client = new VoyageAIClient({ apiKey: process.env.VOYAGEAI_API_KEY });
  }
  return client;
}

export async function embedTexts(
  texts: string[],
  inputType: "query" | "document" = "document"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const result = await getVoyageClient().embed({
    input: texts,
    model: EMBEDDING_MODEL,
    inputType,
    outputDimension: EMBEDDING_DIMENSION,
  });
  return (result.data ?? [])
    .map((d) => d.embedding)
    .filter((e): e is number[] => Array.isArray(e));
}

export async function embedQuery(text: string): Promise<number[]> {
  const vectors = await embedTexts([text], "query");
  const vector = vectors[0];
  if (!vector) {
    throw new Error("Embedding API returned no vector for the query");
  }
  return vector;
}