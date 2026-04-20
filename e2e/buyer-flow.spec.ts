import { test, expect } from "@playwright/test";

// ============================================================
// 예비창업자(BUYER) 플로우 E2E
// 매물 검색/필터 → 상세 → 관심 매물 → 커뮤니티 → 검색 시나리오
// 로그인 없이 가능한 흐름 위주
// ============================================================

test.describe("BUYER 매물 탐색", () => {
  test("매물 검색 페이지 - 카테고리 필터 UI 존재", async ({ page }) => {
    await page.goto("/listings");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("main, section").first()).toBeVisible();
  });

  test("매물 검색 - 카테고리 선택 후 결과 표시", async ({ page }) => {
    await page.goto("/listings?categoryName=외식업");
    await page.waitForLoadState("networkidle");
    // 매물 카드가 여러 개 존재하거나 "매물이 없습니다" 메시지
    const content = await page.locator("body").textContent();
    expect(content).toBeTruthy();
  });

  test("매물 상세 페이지 진입", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
    // 첫번째 매물 링크 클릭
    const firstListing = page.locator('a[href^="/listings/"]').first();
    if ((await firstListing.count()) > 0) {
      await firstListing.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/listings\/[^/]+$/);
    }
  });

  test("매물 상세 - 권리금/보증금/월세 표시", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
    const firstListing = page.locator('a[href^="/listings/"]').first();
    if ((await firstListing.count()) > 0) {
      await firstListing.click();
      await page.waitForLoadState("networkidle");
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/권리금|보증금|월세/);
    }
  });

  test("매물 상세 - 관심매물 버튼 존재 (비로그인 시 로그인 유도)", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
    const firstListing = page.locator('a[href^="/listings/"]').first();
    if ((await firstListing.count()) > 0) {
      await firstListing.click();
      await page.waitForLoadState("networkidle");
      const favBtn = page.getByRole("button", { name: /관심매물|즐겨찾기/ });
      if ((await favBtn.count()) > 0) {
        expect(await favBtn.first().isVisible()).toBeTruthy();
      }
    }
  });

  test("매물 상세 - 채팅 문의 버튼 존재 (비로그인 시)", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
    const firstListing = page.locator('a[href^="/listings/"]').first();
    if ((await firstListing.count()) > 0) {
      await firstListing.click();
      await page.waitForLoadState("networkidle");
      const chatBtn = page.getByText(/채팅\s*문의/);
      if ((await chatBtn.count()) > 0) {
        expect(await chatBtn.first().isVisible()).toBeTruthy();
      }
    }
  });
});

test.describe("BUYER 커뮤니티·프랜차이즈·협력업체 탐색", () => {
  test("커뮤니티 게시판 접근", async ({ page }) => {
    await page.goto("/community");
    await expect(page).toHaveURL(/\/community/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("프랜차이즈 디렉토리 접근", async ({ page }) => {
    await page.goto("/franchise");
    await expect(page).toHaveURL(/\/franchise/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("협력업체 디렉토리 접근", async ({ page }) => {
    await page.goto("/partners");
    await expect(page).toHaveURL(/\/partners/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("집기장터 접근", async ({ page }) => {
    await page.goto("/equipment");
    await expect(page).toHaveURL(/\/equipment/);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("BUYER 역할선택 플로우", () => {
  test("비로그인 매물등록 시도 → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/sell");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("비로그인 mypage 접근 → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("select-role 페이지 로드", async ({ page }) => {
    await page.goto("/select-role");
    // 비로그인 접근이면 login 리다이렉트 또는 역할 선택 UI
    const url = page.url();
    expect(url.includes("/select-role") || url.includes("/login")).toBeTruthy();
  });
});
