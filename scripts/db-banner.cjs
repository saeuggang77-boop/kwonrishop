#!/usr/bin/env node
/**
 * dev 시작 전 현재 DATABASE_URL의 호스트를 시각적으로 표시
 * - dev 브랜치: 🟢 안전
 * - main 브랜치(prod): 🚨🚨 경고
 * - 기타: ⚠️  주의
 */

const fs = require("fs");
const path = require("path");

// 권리샵 프로덕션 endpoint (절대 변경 금지)
const PROD_HOSTS = [
  "ep-royal-thunder-a1cj0jij",
];

// 권리샵 dev branch endpoint (변경 시 업데이트)
const DEV_HOSTS = [
  "ep-shiny-waterfall-a1612qb7",
];

// .env.local 로드
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

function extractHost(url) {
  if (!url) return null;
  const m = url.match(/@([^/:?]+)/);
  return m ? m[1] : null;
}

const dbUrl = process.env.DATABASE_URL;
const host = extractHost(dbUrl);

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const cyan = "\x1b[36m";
const bgRed = "\x1b[41m";

console.log("");
if (!host) {
  console.log(`${yellow}⚠️  DATABASE_URL 환경변수가 설정되지 않았습니다.${reset}`);
} else if (PROD_HOSTS.some((h) => host.includes(h))) {
  console.log(`${bgRed}${bold}                                                    ${reset}`);
  console.log(`${bgRed}${bold}  🚨🚨🚨  PRODUCTION DB 연결 — 매우 위험!  🚨🚨🚨  ${reset}`);
  console.log(`${bgRed}${bold}                                                    ${reset}`);
  console.log(`${red}${bold}  호스트: ${host}${reset}`);
  console.log(`${red}  로컬에서 prod DB를 가리키고 있습니다.${reset}`);
  console.log(`${red}  실수로 데이터 변경 시 즉시 프로덕션에 반영됩니다.${reset}`);
  console.log(`${red}  의도적이 아니라면 .env.local의 DATABASE_URL을 dev 브랜치로 바꾸세요.${reset}`);
  console.log("");
} else if (DEV_HOSTS.some((h) => host.includes(h))) {
  console.log(`${green}${bold}🟢 DEV branch 연결됨${reset} ${cyan}(${host})${reset}`);
  console.log(`${green}   안전한 분리 환경입니다. 자유롭게 테스트하세요.${reset}`);
  console.log("");
} else {
  console.log(`${yellow}⚠️  알 수 없는 DB 호스트: ${host}${reset}`);
  console.log(`${yellow}   PROD/DEV 호스트 목록에 없습니다. scripts/db-banner.cjs를 확인하세요.${reset}`);
  console.log("");
}
