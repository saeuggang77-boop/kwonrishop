import { test, expect } from "@playwright/test";

test.describe("인증 페이지", () => {
  test("로그인 페이지에 소셜 로그인 버튼 존재", async ({ page }) => {
    await page.goto("/auth/login");

    // 카카오 또는 네이버 로그인 버튼 확인
    const kakaoButton = page.getByRole("button", { name: /카카오/ });
    const naverButton = page.getByRole("button", { name: /네이버/ });

    const hasKakao = await kakaoButton.isVisible().catch(() => false);
    const hasNaver = await naverButton.isVisible().catch(() => false);

    expect(hasKakao || hasNaver).toBeTruthy();
  });

  test("마이페이지 접근 시 로그인 리디렉션", async ({ page }) => {
    await page.goto("/mypage");

    // 로그인 페이지로 리디렉션되거나, 로그인 유도 메시지가 표시되어야 함
    await page.waitForURL(/\/(auth\/)?login/, { timeout: 5000 }).catch(() => {});

    const isLoginPage = page.url().includes("login");
    const hasLoginPrompt = await page.getByText(/로그인/i).isVisible().catch(() => false);

    expect(isLoginPage || hasLoginPrompt).toBeTruthy();
  });

  test("매물 등록 페이지 접근 시 로그인 필요", async ({ page }) => {
    await page.goto("/sell");

    // 로그인 페이지로 리디렉션되거나, 로그인 유도 메시지가 표시되어야 함
    await page.waitForURL(/\/(auth\/)?login/, { timeout: 5000 }).catch(() => {});

    const isLoginPage = page.url().includes("login");
    const hasLoginPrompt = await page.getByText(/로그인/i).isVisible().catch(() => false);

    expect(isLoginPage || hasLoginPrompt).toBeTruthy();
  });
});
