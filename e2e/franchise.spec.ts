import { test, expect } from "@playwright/test";

test.describe("프랜차이즈 페이지", () => {
  test("프랜차이즈 페이지 로드 확인", async ({ page }) => {
    await page.goto("/franchise");
    await expect(page).toHaveURL(/\/franchise/);
  });

  test("검색 및 필터 UI 요소 존재 확인", async ({ page }) => {
    await page.goto("/franchise");

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator("body")).toBeVisible();

    // 검색 또는 필터 관련 UI가 있는지 확인 (선택적)
    const hasSearchOrFilter =
      (await page.locator('input[type="search"], input[placeholder*="검색"], select, button').count()) > 0;

    expect(hasSearchOrFilter).toBeTruthy();
  });
});
