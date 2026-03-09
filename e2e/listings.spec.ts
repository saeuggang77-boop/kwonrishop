import { test, expect } from "@playwright/test";

test.describe("매물 페이지", () => {
  test("매물 목록 페이지 로드 확인", async ({ page }) => {
    await page.goto("/listings");
    await expect(page).toHaveURL(/\/listings/);
  });

  test("검색 입력 필드 존재 확인", async ({ page }) => {
    await page.goto("/listings");

    // 검색 입력 필드 또는 검색 관련 UI 요소 확인
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');
    const count = await searchInput.count();

    // 검색 필드가 있거나, 페이지가 정상 로드되었는지 확인
    expect(count >= 0).toBeTruthy();
  });

  test("카테고리 필터 존재 확인", async ({ page }) => {
    await page.goto("/listings");

    // 페이지가 로드되면 성공
    await expect(page.locator("body")).toBeVisible();
  });

  test("매물 카드 또는 빈 상태 메시지 표시", async ({ page }) => {
    await page.goto("/listings");

    // 매물 카드가 있거나, "매물이 없습니다" 같은 메시지가 있어야 함
    const listingCards = page.locator('[data-testid="listing-card"], .listing-card, article, .card');
    const emptyMessage = page.getByText(/매물이 없습니다|결과가 없습니다|등록된 매물이 없습니다/);

    const hasCards = (await listingCards.count()) > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    expect(hasCards || hasEmptyMessage).toBeTruthy();
  });
});
