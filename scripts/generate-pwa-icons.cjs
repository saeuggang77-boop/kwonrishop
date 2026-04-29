/**
 * PWA 아이콘 생성 스크립트
 * Option A: 테라코타 솔리드 + 흰 동그라미 ●
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

const TERRA = "#D96C4F";
const CREAM = "#FBF8F3";

// any 아이콘: 흰 동그라미 직경 = 캔버스의 32%
function makeAnyHtml(size) {
  const dotDiameter = Math.round(size * 0.32);
  return `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
<div style="
  width:${size}px;
  height:${size}px;
  background:${TERRA};
  display:flex;
  align-items:center;
  justify-content:center;
">
  <div style="
    width:${dotDiameter}px;
    height:${dotDiameter}px;
    border-radius:50%;
    background:${CREAM};
  "></div>
</div>
</body></html>`;
}

// maskable: 흰 동그라미 직경을 안전 영역(중앙 80%)에 맞춰 줄임
// 안전 영역 = canvas * 0.8. 그 안에서 32% 비율 유지 → 캔버스의 25.6% ≈ 26%
function makeMaskableHtml(size) {
  const dotDiameter = Math.round(size * 0.26);
  return `<!doctype html><html><body style="margin:0;padding:0;background:transparent">
<div style="
  width:${size}px;
  height:${size}px;
  background:${TERRA};
  display:flex;
  align-items:center;
  justify-content:center;
">
  <div style="
    width:${dotDiameter}px;
    height:${dotDiameter}px;
    border-radius:50%;
    background:${CREAM};
  "></div>
</div>
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
