import { loadConfig } from "./config";
import { syncDate, resolveDate } from "./sync";
import { closeDb } from "./mongodb";

function parseArgs(args: string[]): { date?: string } {
  let date: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }

  return { date };
}

async function main(): Promise<void> {
  const { date } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const targetDate = resolveDate(date);

  try {
    await syncDate(config, targetDate);
  } finally {
    await closeDb();
  }
}

main().catch(async (error) => {
  console.error("Fatal error:", error);
  await closeDb();
  process.exit(1);
});
