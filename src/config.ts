import * as dotenv from "dotenv";

dotenv.config();

export interface Config {
  mailgunApiKey: string;
  mailgunDomain: string;
  mailgunRegion: "us" | "eu";
  mailgunUrl: string;
  mongodbUri: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Error: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export function loadConfig(): Config {
  const mailgunApiKey = requireEnv("MAILGUN_API_KEY");
  const mailgunDomain = requireEnv("MAILGUN_DOMAIN");
  const mongodbUri = requireEnv("MONGODB_URI");

  const rawRegion = (process.env.MAILGUN_REGION || "us").toLowerCase();
  const mailgunRegion = rawRegion === "eu" ? "eu" : "us";
  const mailgunUrl =
    mailgunRegion === "eu"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";

  return {
    mailgunApiKey,
    mailgunDomain,
    mailgunRegion,
    mailgunUrl,
    mongodbUri,
  };
}
