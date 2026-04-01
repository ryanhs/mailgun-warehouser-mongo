import { MongoClient, Db, Collection } from "mongodb";
import { DateTime } from "luxon";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(uri: string): Promise<void> {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log(`  Connected to MongoDB: ${db.databaseName}`);
}

export function getDb(): Db {
  if (!db) throw new Error("MongoDB not connected. Call connectDb() first.");
  return db;
}

export function getEventsCollection(): Collection {
  return getDb().collection("events");
}

export function getSyncsCollection(): Collection {
  return getDb().collection("syncs");
}

export async function ensureIndexes(): Promise<void> {
  const events = getEventsCollection();

  await Promise.all([
    events.createIndex({ id: 1 }, { unique: true }),
    events.createIndex({ "@timestamp": 1 }),
    events.createIndex({ event: 1, "@timestamp": 1 }),
    events.createIndex({ recipient: 1, "@timestamp": 1 }),
  ]);

  console.log("  Indexes ensured on events collection");
}

export interface UpsertEventsResult {
  processedCount: number;
  upsertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  skippedNoId: number;
}

export async function upsertEvents(events: Record<string, any>[]): Promise<UpsertEventsResult> {
  if (events.length === 0) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      matchedCount: 0,
      modifiedCount: 0,
      skippedNoId: 0,
    };
  }

  const collection = getEventsCollection();

  // Convert @timestamp from ISO string to native Date for proper indexing
  const docs: Record<string, any>[] = events.map((e) => ({
    ...e,
    "@timestamp": e["@timestamp"] ? new Date(e["@timestamp"]) : e["@timestamp"],
  }));

  const validDocs = docs.filter(
    (doc): doc is Record<string, any> & { id: string } =>
      typeof doc.id === "string" && doc.id.length > 0
  );
  const skippedNoId = docs.length - validDocs.length;

  if (validDocs.length === 0) {
    return {
      processedCount: 0,
      upsertedCount: 0,
      matchedCount: 0,
      modifiedCount: 0,
      skippedNoId,
    };
  }

  const operations = validDocs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  return {
    processedCount: validDocs.length,
    upsertedCount: result.upsertedCount,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    skippedNoId,
  };
}

export async function upsertSync(
  date: string,
  domain: string,
  eventCount: number
): Promise<void> {
  const syncs = getSyncsCollection();

  await syncs.updateOne(
    { date, domain },
    {
      $set: {
        date,
        domain,
        fetchedAt: new Date(),
        eventCount,
      },
    },
    { upsert: true }
  );
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
