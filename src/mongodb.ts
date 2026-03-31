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

export async function insertEvents(events: object[]): Promise<number> {
  if (events.length === 0) return 0;

  const collection = getEventsCollection();

  try {
    const result = await collection.insertMany(events, { ordered: false });
    return result.insertedCount;
  } catch (error: any) {
    // With ordered: false, duplicates throw a BulkWriteError but
    // non-duplicate docs are still inserted
    if (error?.code === 11000 || error?.name === "MongoBulkWriteError") {
      const inserted = error.result?.insertedCount ?? 0;
      return inserted;
    }
    throw error;
  }
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
        fetchedAt: DateTime.utc().toISO(),
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
