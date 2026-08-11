import { buildChunks } from "../lib/chunks.ts";
import { embedTexts } from "../lib/embeddings.ts";
import {
  COLLECTION_NAME,
  getQdrantClient,
  recreateCollection,
  upsertVectors,
} from "../lib/qdrant.ts";

const BATCH_SIZE = 64;

async function main() {
  const chunks = await buildChunks();
  console.log(`Built ${chunks.length} chunks`);

  const texts = chunks.map((c) => c.text);
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchVectors = await embedTexts(batch, "document");
    vectors.push(...batchVectors);
    console.log(`Embedded ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length}`);
  }

  const points = chunks.map((c, i) => ({
    id: c.id,
    vector: vectors[i],
    payload: { ...c.metadata, text: c.text },
  }));

  console.log(`Recreating collection "${COLLECTION_NAME}"...`);
  await recreateCollection();
  await upsertVectors(points);
  console.log(`Upserted ${points.length} points into "${COLLECTION_NAME}"`);

  const client = getQdrantClient();
  const info = await client.getCollection(COLLECTION_NAME);
  console.log(
    `Collection "${COLLECTION_NAME}" now has ${info.points_count ?? "?"} points`
  );
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});