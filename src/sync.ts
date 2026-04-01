import { DateTime } from "luxon";
import { Config } from "./config";
import { fetchEvents } from "./mailgun-client";
import { connectDb, ensureIndexes, upsertEvents, upsertSync, closeDb } from "./mongodb";

export async function syncDate(config: Config, date: DateTime): Promise<void> {
  const dateStr = date.toFormat("yyyy-MM-dd");
  const begin = date.startOf("day");
  const end = date.endOf("day");

  console.log(`\nSyncing events for ${dateStr} (${config.mailgunDomain})`);
  console.log(`  Range: ${begin.toISO()} to ${end.toISO()}`);

  await connectDb(config.mongodbUri);
  await ensureIndexes();

  let totalProcessed = 0;
  let totalUpserted = 0;
  let totalMatched = 0;
  let totalModified = 0;
  let totalSkippedNoId = 0;

  const { totalEvents, pagesCount } = await fetchEvents(
    config,
    begin,
    end,
    async (items, _pageNum, _totalSoFar) => {
      const result = await upsertEvents(items);
      totalProcessed += result.processedCount;
      totalUpserted += result.upsertedCount;
      totalMatched += result.matchedCount;
      totalModified += result.modifiedCount;
      totalSkippedNoId += result.skippedNoId;
    }
  );

  console.log(`  Fetched ${totalEvents} events across ${pagesCount} page(s)`);
  console.log(`  Upserted ${totalProcessed} events (new: ${totalUpserted}, existing matched: ${totalMatched}, existing modified: ${totalModified})`);
  if (totalSkippedNoId > 0) {
    console.log(`  Skipped ${totalSkippedNoId} event(s) without id`);
  }

  await upsertSync(dateStr, config.mailgunDomain, totalEvents);

  console.log(`  Sync complete for ${dateStr}`);
}

export function resolveDate(dateArg?: string): DateTime {
  if (dateArg) {
    const parsed = DateTime.fromFormat(dateArg, "yyyy-MM-dd", { zone: "utc" });
    if (!parsed.isValid) {
      console.error(`Error: Invalid date format "${dateArg}". Use YYYY-MM-DD.`);
      process.exit(1);
    }
    return parsed;
  }
  // Default to yesterday (UTC)
  return DateTime.utc().minus({ days: 1 }).startOf("day");
}
