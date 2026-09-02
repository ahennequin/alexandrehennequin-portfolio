import { COLLECTION_NAME, getQdrantClient } from "../lib/qdrant.ts";
import { buildIndexPoints, reindex } from "../lib/vectorIndex.ts";

async function main() {
  const points = await buildIndexPoints();
  console.log(`Built ${points.length} points`);

  console.log(`Recreating collection "${COLLECTION_NAME}" and indexing...`);
  const count = await reindex(points, (embedded, total) =>
    console.log(`Embedded ${embedded}/${total}`)
  );
  console.log(`Upserted ${count} points into "${COLLECTION_NAME}"`);

  const info = await getQdrantClient().getCollection(COLLECTION_NAME);
  console.log(
    `Collection "${COLLECTION_NAME}" now has ${info.points_count ?? "?"} points`
  );
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
