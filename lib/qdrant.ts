import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBEDDING_DIMENSION } from "./embeddings.ts";

export const COLLECTION_NAME = "site_content";

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!process.env.QDRANT_CLUSTER_ENDPOINT || !process.env.QDRANT_API_KEY) {
    throw new Error(
      "QDRANT_CLUSTER_ENDPOINT and QDRANT_API_KEY must be set (Vercel env vars)"
    );
  }
  if (!client) {
    client = new QdrantClient({
      url: process.env.QDRANT_CLUSTER_ENDPOINT,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }
  return client;
}

export async function recreateCollection(): Promise<void> {
  const c = getQdrantClient();
  await c.recreateCollection(COLLECTION_NAME, {
    vectors: { size: EMBEDDING_DIMENSION, distance: "Cosine" },
  });
}

export type UpsertPoint = {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
};

export async function upsertVectors(points: UpsertPoint[]): Promise<void> {
  if (points.length === 0) return;
  const c = getQdrantClient();
  await c.upsert(COLLECTION_NAME, {
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  });
}

export type RetrievalHit = {
  id: string;
  score: number;
  payload: Record<string, unknown>;
};

export async function retrieve(
  vector: number[],
  topK = 4,
  lang?: "en" | "fr"
): Promise<RetrievalHit[]> {
  const c = getQdrantClient();
  const res = await c.query(COLLECTION_NAME, {
    query: vector,
    limit: topK,
    with_payload: true,
    filter: lang
      ? { must: [{ key: "lang", match: { value: lang } }] }
      : undefined,
  });
  return res.points.map((hit) => ({
    id: String(hit.id),
    score: hit.score,
    payload: (hit.payload as Record<string, unknown>) ?? {},
  }));
}