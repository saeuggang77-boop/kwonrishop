import { test, expect } from "@playwright/test";

test.describe("홈페이지", () => {
  test("타이틀에 권리샵 포함 확인", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/권리샵/);
  });

  test("헤더 네비게이션 링크 존재 확인", async ({ page }) => {
    await page.goto("/");

    // 헤더가 존재하는지 확인
    const header = page.locator("header, nav");
    await expect(header.first()).toBeVisible();
  });

  test("푸터 표시 확인", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });

  test("카테고리 섹션 표시 확인", async ({ page }) => {
    await page.goto("/");

    // "업종별 매물 찾기" 제목 확인
    const heading = page.getByRole("heading", { name: /업종별 매물 찾기/ });
    await expect(heading).toBeVisible();

    // 카테고리 항목들이 있는지 확인
    const categories = page.getByText("외식업");
    await expect(categories).toBeVisible();
  });

  test("주요 CTA 버튼 존재 확인", async ({ page }) => {
    await page.goto("/");

    // "매물 검색하기" 버튼
    const searchButton = page.getByRole("link", { name: /매물 검색하기/ });
    await expect(searchButton).toBeVisible();

    // "내 매물 등록하기" 버튼
    const registerButton = page.getByRole("link", { name: /내 매물 등록하기/ });
    await expect(registerButton).toBeVisible();
  });
});
