#!/usr/bin/env node
/**
 * 위험한 prisma 명령 실행 전 DATABASE_URL 검사 가드
 *
 * 사용:
 *   node scripts/safe-db-cmd.cjs reset
 *   node scripts/safe-db-cmd.cjs push
 *   node scripts/safe-db-cmd.cjs seed
 *   node scripts/safe-db-cmd.cjs migrate-deploy
 *   node scripts/safe-db-cmd.cjs migrate-dev
 *   node scripts/safe-db-cmd.cjs studio
 *
 * 동작:
 * - DATABASE_URL의 호스트가 PROD_HOSTS 목록에 있으면 즉시 거부
 * - 그 외(dev branch 등)는 통과
 * - 의도적으로 prod에 적용하려면 ALLOW_PROD=1 환경변수로 우회 가능
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ===== 설정 =====
const PROD_HOSTS = [
  "ep-royal-thunder-a1cj0jij", // 권리샵 main 브랜치 endpoint
];

const COMMAND_MAP = {
  reset: ["prisma", "migrate", "reset"],
  push: ["prisma", "db", "push"],
  seed: ["prisma", "db", "seed"],
  "migrate-deploy": ["prisma", "migrate", "deploy"],
  "migrate-dev": ["prisma", "migrate", "dev"],
  studio: ["prisma", "studio"],
  "db-execute": ["prisma", "db", "execute"],
};

// ===== .env.local 로드 =====
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*?)["']?$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

// ===== 호스트 추출 =====
function extractHost(url) {
  if (!url) return null;
  const m = url.match(/@([^/:?]+)/);
  return m ? m[1] : null;
}

// ===== 메인 =====
const cmdKey = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!cmdKey || !COMMAND_MAP[cmdKey]) {
  console.error("\n❌ 사용법: node scripts/safe-db-cmd.cjs <command>");
  console.error("   사용 가능: " + Object.keys(COMMAND_MAP).join(", ") + "\n");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
const host = extractHost(dbUrl);

console.log("\n┌─ DB 안전 검사 ─────────────────────────────────");
console.log("│ 명령: " + cmdKey);
console.log("│ 호스트: " + (host || "(불명)"));

const isProd = host && PROD_HOSTS.some((h) => host.includes(h));

if (isProd) {
  if (process.env.ALLOW_PROD !== "1") {
    console.error("│");
    console.error("│ 🚨🚨🚨 차단됨: 이 명령은 프로덕션 DB를 변경합니다!");
    console.error("│");
    console.error("│ 의도적으로 프로덕션에 적용하려면:");
    console.error("│   ALLOW_PROD=1 npm run db:" + cmdKey);
    console.error("│");
    console.error("│ 로컬에서 안전하게 실행하려면 .env.local의 DATABASE_URL을");
    console.error("│ dev 브랜치 호스트(ep-shiny-waterfall)로 바꾸세요.");
    console.error("└──────────────────────────────────────────────────\n");
    process.exit(1);
  } else {
    console.log("│ ⚠️  ALLOW_PROD=1 — 프로덕션에 적용합니다 (의도적)");
  }
} else {
  console.log("│ ✅ 안전 (dev 브랜치 또는 외부 DB)");
}
console.log("└──────────────────────────────────────────────────\n");

// ===== 실행 =====
const [bin, ...rest] = COMMAND_MAP[cmdKey];
const args = [bin, ...rest, ...extraArgs];

const result = spawnSync("npx", args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
