import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: "test/screenshots/home-current-desktop.png", fullPage: true });
console.log("desktop saved");

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mobile.newPage();
await mp.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
await mp.waitForTimeout(2000);
await mp.screenshot({ path: "test/screenshots/home-current-mobile.png", fullPage: true });
console.log("mobile saved");

await browser.close();
