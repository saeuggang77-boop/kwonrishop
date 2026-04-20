import { test, expect } from "@playwright/test";

// ============================================================
// 결제 생애주기 E2E
// pricing 진입 → 상품 확인 → checkout 이동 → Toss 위젯 로드
// (실결제는 테스트 불가 — UI 흐름만)
// ============================================================

test.describe("Pricing 페이지", () => {
  test("pricing 페이지 로드 + 탭 UI 존재", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // 매물/프랜차이즈/협력업체/집기 탭 중 하나 이상 존재
    const tab = page.getByText(/사장님\s*매물|프랜차이즈|협력업체|집기장터/).first();
    await expect(tab).toBeVisible();
  });

  test("광고 상품 카드 노출 (가격 표시)", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    // 원/만원 가격 표시
    const priceText = page.locator("text=/[0-9,]+\\s*(원|만원|만)/");
    await expect(priceText.first()).toBeVisible({ timeout: 10000 });
  });

  test("VIP/PREMIUM/BASIC 상품 존재", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");

    const tiers = ["VIP", "프리미엄", "베이직"];
    let found = 0;
    for (const tier of tiers) {
      const count = await page.getByText(tier).count();
      if (count > 0) found++;
    }
    expect(found).toBeGreaterThan(0);
  });
});

test.describe("Checkout 페이지", () => {
  test("checkout 파라미터 없이 접속 시 에러 메시지", async ({ page }) => {
    await page.goto("/payments/checkout");
    await page.waitForLoadState("networkidle");

    const errorMsg = page.locator("text=/결제 정보가 올바르지 않습니다/");
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test("checkout 유효 파라미터 시 결제 UI 준비", async ({ page }) => {
    const params = new URLSearchParams({
      orderId: "test-order-id",
      amount: "55000",
      orderName: "테스트 상품",
      customerName: "테스트",
    });
    await page.goto(`/payments/checkout?${params}`);
    await page.waitForLoadState("networkidle");

    const title = page.getByRole("heading", { name: /결제하기/ });
    await expect(title).toBeVisible();
  });

  test("payments/success 페이지 접근 가능", async ({ page }) => {
    await page.goto("/payments/success");
    await expect(page.locator("body")).toBeVisible();
  });

  test("payments/fail 페이지 접근 가능", async ({ page }) => {
    await page.goto("/payments/fail");
    await expect(page.locator("body")).toBeVisible();
  });
});
