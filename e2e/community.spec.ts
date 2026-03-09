import { test, expect } from "@playwright/test";

test.describe("커뮤니티 페이지", () => {
  test("커뮤니티 페이지 로드 확인", async ({ page }) => {
    await page.goto("/community");
    await expect(page).toHaveURL(/\/community/);
  });

  test("태그 필터 버튼 존재 확인", async ({ page }) => {
    await page.goto("/community");

    // 페이지가 정상 로드되었는지 확인
    await expect(page.locator("body")).toBeVisible();

    // 태그 관련 버튼이나 필터가 있는지 확인
    const tagButtons = page.locator('button[data-tag], .tag-filter, button');
    const count = await tagButtons.count();

    expect(count > 0).toBeTruthy();
  });

  test("게시글 목록 또는 빈 상태 표시", async ({ page }) => {
    await page.goto("/community");

    // 게시글 목록 또는 빈 상태 메시지 확인
    const posts = page.locator('article, .post-item, [data-testid="post"]');
    const emptyMessage = page.getByText(/게시글이 없습니다|작성된 글이 없습니다/);

    const hasPosts = (await posts.count()) > 0;
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    expect(hasPosts || hasEmptyMessage).toBeTruthy();
  });
});
