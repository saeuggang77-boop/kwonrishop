import { test, expect } from "@playwright/test";

// ============================================================
// ADMIN 플로우 E2E - 비로그인 접근 차단 + 공개 검증
// ============================================================

test.describe("ADMIN 접근 제어", () => {
  const adminPaths = [
    "/admin",
    "/admin/users",
    "/admin/listings",
    "/admin/partners",
    "/admin/equipment",
    "/admin/community",
    "/admin/reports",
    "/admin/products",
    "/admin/notices",
  ];

  for (const path of adminPaths) {
    test(`비로그인 ${path} 접근 → 리다이렉트`, async ({ page }) => {
      await page.goto(path);
      // 로그인 페이지로 리다이렉트되어야 함 (middleware)
      await page.waitForURL((url) => !url.pathname.startsWith(path), { timeout: 5000 });
      expect(page.url()).not.toContain(path);
    });
  }
});

test.describe("ADMIN API 권한 체크", () => {
  const adminApis = [
    "/api/admin/listings",
    "/api/admin/users",
    "/api/admin/partners",
    "/api/admin/equipment",
    "/api/admin/community",
    "/api/admin/reports",
    "/api/admin/products",
    "/api/admin/paid-stats",
  ];

  for (const api of adminApis) {
    test(`비로그인 GET ${api} → 401/403`, async ({ request }) => {
      const res = await request.get(api);
      expect([401, 403]).toContain(res.status());
    });
  }
});
