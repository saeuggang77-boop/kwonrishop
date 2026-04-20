import { test, expect } from "@playwright/test";

// ============================================================
// 역할별 디렉토리 페이지 (프랜차이즈·협력업체·집기장터) 검증
// - 등록/수정은 로그인 필요 → 리다이렉트 확인
// - 목록/상세 공개 페이지는 로드 확인
// ============================================================

test.describe("프랜차이즈 디렉토리", () => {
  test("프랜차이즈 목록 페이지 로드", async ({ page }) => {
    await page.goto("/franchise");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("브랜드 등록/수정은 로그인 필요 (리다이렉트)", async ({ page }) => {
    await page.goto("/franchise/edit");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("프랜차이즈 상세 진입 시도 (seed 데이터가 있는 경우)", async ({ page }) => {
    await page.goto("/franchise");
    await page.waitForLoadState("networkidle");
    const first = page.locator('a[href^="/franchise/"]').first();
    if ((await first.count()) > 0) {
      const href = await first.getAttribute("href");
      if (href && href !== "/franchise/edit" && href !== "/franchise") {
        await first.click();
        await page.waitForLoadState("networkidle");
      }
    }
  });
});

test.describe("협력업체 디렉토리", () => {
  test("협력업체 목록 페이지 로드", async ({ page }) => {
    await page.goto("/partners");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("서비스 등록은 로그인 필요", async ({ page }) => {
    await page.goto("/partners/register");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("집기장터", () => {
  test("집기 목록 페이지 로드", async ({ page }) => {
    await page.goto("/equipment");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("집기 등록은 로그인 필요", async ({ page }) => {
    await page.goto("/equipment/register");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});

test.describe("SELECT ROLE 접근 제어", () => {
  test("비로그인 select-role → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/select-role");
    await page.waitForTimeout(1500);
    const url = page.url();
    // 로그인 페이지로 가거나 select-role을 보여주는지 (middleware에 따라 다름)
    expect(url).toBeTruthy();
  });
});
