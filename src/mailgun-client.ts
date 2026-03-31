import { DateTime } from "luxon";
import { Config } from "./config";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const PAGE_LIMIT = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toRfc2822(dt: DateTime): string {
  // Mailgun expects RFC 2822 format: "Mon, 08 Jul 2024 00:00:00 -0000"
  return dt.toUTC().toRFC2822()!;
}

function basicAuth(apiKey: string): string {
  return "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");
}

async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.statusCode;

      const isRetryable =
        status === 429 ||
        (typeof status === "number" && status >= 500 && status < 600) ||
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT";

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw new Error(
          `${context} failed after ${attempt + 1} attempt(s): ${error?.message || error}`
        );
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.log(
        `  Retry ${attempt + 1}/${MAX_RETRIES} for ${context} (waiting ${delay}ms)...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

interface LogsApiResponse {
  start: string;
  end: string;
  items: any[];
  pagination: {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    total?: number;
  };
  aggregates?: any;
}

async function postLogsApi(
  config: Config,
  body: Record<string, any>
): Promise<LogsApiResponse> {
  const url = `${config.mailgunUrl}/v1/analytics/logs`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(config.mailgunApiKey),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    const err: any = new Error(`Mailgun API ${response.status}: ${text}`);
    err.status = response.status;
    throw err;
  }

  return response.json() as Promise<LogsApiResponse>;
}

export interface FetchEventsResult {
  totalEvents: number;
  pagesCount: number;
}

export type OnPageCallback = (items: any[], pageNum: number, totalSoFar: number) => void | Promise<void>;

export async function fetchEvents(
  config: Config,
  begin: DateTime,
  end: DateTime,
  onPage: OnPageCallback
): Promise<FetchEventsResult> {
  let totalEvents = 0;
  let pagesCount = 0;
  let paginationToken: string | undefined = undefined;

  while (true) {
    const body: Record<string, any> = {
      start: toRfc2822(begin),
      end: toRfc2822(end),
      filter: {
        AND: [
          {
            attribute: "domain",
            comparator: "=",
            values: [
              { label: config.mailgunDomain, value: config.mailgunDomain },
            ],
          },
        ],
      },
      pagination: {
        limit: PAGE_LIMIT,
        sort: "timestamp:asc",
        ...(paginationToken ? { token: paginationToken } : {}),
      },
    };

    const response = await withRetry(
      () => postLogsApi(config, body),
      `fetch events page ${pagesCount + 1}`
    );

    pagesCount++;
    const items = response.items || [];
    totalEvents += items.length;

    if (items.length > 0) {
      await onPage(items, pagesCount, totalEvents);
    }

    console.log(
      `  Page ${pagesCount}: ${items.length} events (${totalEvents} total)`
    );

    if (items.length === 0 || !response.pagination?.next) {
      break;
    }

    paginationToken = response.pagination.next;
  }

  return { totalEvents, pagesCount };
}
