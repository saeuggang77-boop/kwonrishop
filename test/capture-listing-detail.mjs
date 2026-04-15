import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/listings/cmnbybrjr002cya8z1zjqiq9l", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: "test/screenshots/listing-detail-desktop.png", fullPage: true });
console.log("desktop saved");

const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m.newPage();
await mp.goto("http://localhost:3000/listings/cmnbybrjr002cya8z1zjqiq9l", { waitUntil: "domcontentloaded", timeout: 60000 });
await mp.waitForTimeout(2500);
await mp.screenshot({ path: "test/screenshots/listing-detail-mobile.png", fullPage: true });
console.log("mobile saved");

await browser.close();
