/**
 * PWA 아이콘 생성 스크립트
 * 시안: C-1 — 어닝(차양) 점포 + 코인 (권리샵 = 상가 직거래)
 *
 * 출력:
 *   public/icons/icon-192.png        — 192x192 (Android)
 *   public/icons/icon-512.png        — 512x512 (Android, splash)
 *   public/icons/icon-maskable-512.png — 512x512 (Android adaptive, 80% safe area)
 *   public/icons/apple-touch-icon.png — 180x180 (iOS)
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "icons");

const CREAM = "#FBF8F3";
const TERRA = "#D96C4F";
const GREEN = "#1F3F2E";

// any 아이콘: 코인(테라코타) 원 안에 어닝 점포
function makeAnyHtml(size) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
<svg viewBox="0 0 192 192" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="${CREAM}"/>
  <circle cx="96" cy="96" r="78" fill="${TERRA}"/>
  <circle cx="96" cy="96" r="64" fill="none" stroke="${CREAM}" stroke-width="3" opacity="0.55"/>
  <rect x="60" y="76" width="72" height="50" fill="${CREAM}"/>
  <polygon points="56,76 136,76 128,62 64,62" fill="${GREEN}"/>
  <line x1="76" y1="62" x2="72" y2="76" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="92" y1="62" x2="90" y2="76" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="108" y1="62" x2="108" y2="76" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="120" y1="62" x2="124" y2="76" stroke="${CREAM}" stroke-width="2.5"/>
  <rect x="86" y="98" width="20" height="28" rx="2" fill="${GREEN}"/>
  <rect x="65" y="82" width="16" height="14" fill="${GREEN}" opacity="0.18"/>
  <rect x="111" y="82" width="16" height="14" fill="${GREEN}" opacity="0.18"/>
</svg>
</body></html>`;
}

// maskable: 코랄 배경 풀스크린 + 콘텐츠를 중앙 80% safe zone에 배치 (코인 외곽 원 제거)
function makeMaskableHtml(size) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
<svg viewBox="0 0 240 240" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="240" height="240" fill="${TERRA}"/>
  <rect x="84" y="100" width="72" height="50" fill="${CREAM}"/>
  <polygon points="80,100 160,100 152,86 88,86" fill="${GREEN}"/>
  <line x1="100" y1="86" x2="96" y2="100" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="116" y1="86" x2="114" y2="100" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="132" y1="86" x2="132" y2="100" stroke="${CREAM}" stroke-width="2.5"/>
  <line x1="144" y1="86" x2="148" y2="100" stroke="${CREAM}" stroke-width="2.5"/>
  <rect x="110" y="122" width="20" height="28" rx="2" fill="${GREEN}"/>
  <rect x="89" y="106" width="16" height="14" fill="${GREEN}" opacity="0.18"/>
  <rect x="135" y="106" width="16" height="14" fill="${GREEN}" opacity="0.18"/>
</svg>
</body></html>`;
}

async function render(html, size, outPath) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const buf = await page.screenshot({
    type: "png",
    omitBackground: false,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  fs.writeFileSync(outPath, buf);
  await browser.close();
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const tasks = [
    { size: 192, file: "icon-192.png", html: makeAnyHtml(192) },
    { size: 512, file: "icon-512.png", html: makeAnyHtml(512) },
    { size: 512, file: "icon-maskable-512.png", html: makeMaskableHtml(512) },
    { size: 180, file: "apple-touch-icon.png", html: makeAnyHtml(180) },
  ];

  for (const t of tasks) {
    const out = path.join(OUTPUT_DIR, t.file);
    await render(t.html, t.size, out);
    console.log(`generated ${t.file} (${t.size}x${t.size})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
