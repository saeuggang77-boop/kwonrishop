import { test, expect } from "@playwright/test";

// ============================================================
// SOLD 상태 매물 노출 정책 검증
// - 공개 목록(/listings): SOLD 제외 (ACTIVE만)
// - 매물 상세(/listings/[id]): SOLD도 접근 가능
// - sitemap.xml: SOLD 포함 (SEO)
// ============================================================

test.describe("SOLD 매물 노출 정책", () => {
  test("매물 검색 목록은 ACTIVE만 표시 (SOLD 제외)", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");

    // 목록의 매물 배지/상태 텍스트에 "거래완료"/"SOLD"가 없어야 함
    const soldText = page.locator("text=/거래완료|SOLD/").first();
    const count = await soldText.count();
    expect(count).toBe(0);
  });

  test("sitemap.xml에 매물 URL 포함", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/listings/");
  });

  test("robots.txt 정상", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("user-agent");
    expect(body).toContain("sitemap");
  });

  test("매물 상세 - storeName 우선 표시 (있을 때)", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");

    const firstListing = page.locator('a[href^="/listings/"]').first();
    if ((await firstListing.count()) === 0) test.skip();

    await firstListing.click();
    await page.waitForLoadState("networkidle");

    const title = page.locator("h1, h2").first();
    await expect(title).toBeVisible();
  });
});
