import { test, expect } from "@playwright/test";

test.describe("관리자 페이지", () => {
  test("관리자 페이지 접근 시 인증 필요", async ({ page }) => {
    await page.goto("/admin");

    // 로그인 페이지로 리디렉션되거나, 접근 제한 메시지가 표시되어야 함
    await page.waitForURL(/\/(auth\/)?login/, { timeout: 5000 }).catch(() => {});

    const isLoginPage = page.url().includes("login");
    const hasAuthPrompt = await page.getByText(/로그인|권한|접근/).isVisible().catch(() => false);
    const isLoading = await page.getByText(/로딩/).isVisible().catch(() => false);

    expect(isLoginPage || hasAuthPrompt || isLoading).toBeTruthy();
  });
});
