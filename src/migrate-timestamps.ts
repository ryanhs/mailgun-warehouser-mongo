/**
 * One-time migration: convert @timestamp from string to native Date.
 *
 * Usage:
 *   npx tsx src/migrate-timestamps.ts
 *
 * Safe to re-run — only updates documents where @timestamp is still a string.
 */

import { loadConfig } from "./config";
import { connectDb, getEventsCollection, closeDb } from "./mongodb";

async function migrate(): Promise<void> {
  const config = loadConfig();
  await connectDb(config.mongodbUri);

  const events = getEventsCollection();

  // Count docs that still have string timestamps
  const toMigrate = await events.countDocuments({
    "@timestamp": { $type: "string" },
  });

  console.log(`Found ${toMigrate} documents with string @timestamp`);

  if (toMigrate === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  const BATCH_SIZE = 1000;
  let migrated = 0;

  // Process in batches using a cursor
  const cursor = events.find(
    { "@timestamp": { $type: "string" } },
    { projection: { _id: 1, "@timestamp": 1 } }
  );

  let bulk: { updateOne: { filter: object; update: object } }[] = [];

  for await (const doc of cursor) {
    const ts = doc["@timestamp"];
    const date = new Date(ts);

    if (isNaN(date.getTime())) {
      console.warn(`  Skipping invalid timestamp: ${ts} (doc ${doc._id})`);
      continue;
    }

    bulk.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { "@timestamp": date } },
      },
    });

    if (bulk.length >= BATCH_SIZE) {
      const result = await events.bulkWrite(bulk);
      migrated += result.modifiedCount;
      console.log(`  Migrated ${migrated} / ${toMigrate}`);
      bulk = [];
    }
  }

  // Flush remaining
  if (bulk.length > 0) {
    const result = await events.bulkWrite(bulk);
    migrated += result.modifiedCount;
  }

  console.log(`\nMigration complete: ${migrated} documents updated.`);
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => closeDb());
