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

    // 페이지가 로드되고 상품 관련 콘텐츠가 있는지 확인
    await expect(page.locator("body")).toBeVisible();

    // 상품 카드나 가격 정보가 있는지 확인
    const hasProducts = (await page.locator('.card, article, [data-testid="product"]').count()) > 0;
    const hasPricing = await page.getByText(/원|₩|가격/).isVisible().catch(() => false);

    expect(hasProducts || hasPricing).toBeTruthy();
  });
});
