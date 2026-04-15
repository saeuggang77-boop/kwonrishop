import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT = "test/screenshots";
mkdirSync(OUT, { recursive: true });

const pages = [
  { slug: "home", url: "/" },
  { slug: "listings", url: "/listings" },
  { slug: "franchise", url: "/franchise" },
  { slug: "partners", url: "/partners" },
  { slug: "equipment", url: "/equipment" },
  { slug: "pricing", url: "/pricing" },
  { slug: "community", url: "/community" },
  { slug: "login", url: "/login" },
  { slug: "signup", url: "/signup" },
  { slug: "guide", url: "/guide" },
  { slug: "faq", url: "/faq" },
];

const viewports = [
  { name: "desktop", w: 1280, h: 900 },
  { name: "mobile", w: 390, h: 844 },
];

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    for (const p of pages) {
      try {
        await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1200);
        const file = join(OUT, `${vp.name}-${p.slug}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`✓ ${vp.name} ${p.slug}`);
      } catch (e) {
        console.log(`✗ ${vp.name} ${p.slug}: ${e.message.slice(0, 80)}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log("done");
