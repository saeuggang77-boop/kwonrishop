import { test, expect } from "@playwright/test";

test.describe("정적 페이지", () => {
  test("이용약관 페이지 로드", async ({ page }) => {
    await page.goto("/terms");

    const heading = page.getByRole("heading", { name: /이용약관/ });
    await expect(heading).toBeVisible();
  });

  test("개인정보처리방침 페이지 로드", async ({ page }) => {
    await page.goto("/privacy");

    const heading = page.getByRole("heading", { name: "개인정보처리방침", exact: true });
    await expect(heading).toBeVisible();
  });

  test("소개 페이지 로드", async ({ page }) => {
    await page.goto("/about");

    const heading = page.getByRole("heading", { name: /권리샵/ }).first();
    await expect(heading).toBeVisible();
  });

  test("광고 상품 페이지 로드", async ({ page }) => {
    await page.goto("/pricing");

    // 페이지 타이틀 확인
    await expect(page.getByText("비즈니스를 성장시키는 프리미엄 서비스")).toBeVisible({ timeout: 10000 });

    // 탭 메뉴 확인
    await expect(page.getByRole("button", { name: "사장님 매물" })).toBeVisible();
  });
});
