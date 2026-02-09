/** Runtime environment variable validation.
 *  Import this in server entry points to fail fast on missing config. */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // Redis
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),

  // Auth
  AUTH_SECRET: required("AUTH_SECRET"),

  // AWS
  AWS_REGION: optional("AWS_REGION", "ap-northeast-2"),
  S3_BUCKET_UPLOADS: optional("S3_BUCKET_UPLOADS", "kwonrishop-uploads"),
  S3_BUCKET_REPORTS: optional("S3_BUCKET_REPORTS", "kwonrishop-reports"),

  // TossPayments
  TOSS_SECRET_KEY: optional("TOSS_SECRET_KEY", ""),

  // CRON
  CRON_SECRET: optional("CRON_SECRET", ""),

  // App
  NEXT_PUBLIC_APP_URL: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  // Node
  NODE_ENV: optional("NODE_ENV", "development"),
} as const;
