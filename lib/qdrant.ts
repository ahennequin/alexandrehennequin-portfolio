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
  // `retrieve()` filters points by `lang`; Qdrant rejects a filter on a field
  // that has no payload index ("Index required but not found for \"lang\"").
  // Create it as part of collection setup so every reindex stays queryable.
  await ensureLangIndex();
}

/**
 * Ensure the `lang` payload field has a keyword index so it can be used in
 * retrieval filters. Safe to call on an existing collection — Qdrant treats a
 * repeat create as a no-op. Exposed so it can be run against a live collection
 * without a full reindex.
 */
export async function ensureLangIndex(): Promise<void> {
  const c = getQdrantClient();
  await c.createPayloadIndex(COLLECTION_NAME, {
    field_name: "lang",
    field_schema: "keyword",
    wait: true,
  });
}

export type UpsertPoint<TPayload = Record<string, unknown>> = {
  id: string;
  vector: number[];
  payload: TPayload;
};

export async function upsertVectors<TPayload = Record<string, unknown>>(
  points: UpsertPoint<TPayload>[]
): Promise<void> {
  if (points.length === 0) return;
  const c = getQdrantClient();
  await c.upsert(COLLECTION_NAME, {
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload as unknown as Record<string, unknown>,
    })),
  });
}

export type RetrievalHit<TPayload = Record<string, unknown>> = {
  id: string;
  score: number;
  payload: TPayload;
};

export async function retrieve<TPayload = Record<string, unknown>>(
  vector: number[],
  topK = 4,
  lang?: "en" | "fr"
): Promise<RetrievalHit<TPayload>[]> {
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
    payload: (hit.payload ?? {}) as TPayload,
  }));
}