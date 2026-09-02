import { buildChunks, type Chunk } from "./chunks.ts";
import { embedTexts } from "./embeddings.ts";
import {
  recreateCollection,
  upsertVectors,
  type UpsertPoint,
} from "./qdrant.ts";

/**
 * The exact shape stored in each Qdrant point's payload and read back at
 * retrieval time: a chunk's metadata plus its embedded text. Defined once
 * here so renaming a field in `Chunk["metadata"]` is a type error on both the
 * ingest side and the retrieval side (`formatContext`), never silent drift.
 */
export type ChunkPayload = Chunk["metadata"] & { text: string };

/** A point that still needs embedding: a stable id and the payload to store. */
export type PendingPoint = { id: string; payload: ChunkPayload };

/** A fully embedded point, ready to upsert into the collection. */
export type IndexPoint = UpsertPoint<ChunkPayload>;

const EMBED_BATCH_SIZE = 64;

/** Build the complete set of points to index from the site's own content. */
export async function buildIndexPoints(): Promise<PendingPoint[]> {
  const chunks = await buildChunks();
  return chunks.map((c) => ({
    id: c.id,
    payload: { ...c.metadata, text: c.text },
  }));
}

/**
 * Run the whole ingest lifecycle: recreate the collection, embed every point's
 * text in batches, then upsert. `scripts/ingest.ts` just supplies the points
 * and, optionally, watches embedding progress.
 */
export async function reindex(
  points: PendingPoint[],
  onProgress?: (embedded: number, total: number) => void
): Promise<number> {
  const vectors: number[][] = [];
  for (let i = 0; i < points.length; i += EMBED_BATCH_SIZE) {
    const batch = points.slice(i, i + EMBED_BATCH_SIZE);
    const batchVectors = await embedTexts(
      batch.map((p) => p.payload.text),
      "document"
    );
    vectors.push(...batchVectors);
    onProgress?.(Math.min(i + EMBED_BATCH_SIZE, points.length), points.length);
  }

  await recreateCollection();
  await upsertVectors(
    points.map(
      (p, i): IndexPoint => ({ id: p.id, vector: vectors[i], payload: p.payload })
    )
  );
  return points.length;
}
