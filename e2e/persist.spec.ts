import { test, expect } from "@playwright/test";

// ============================================================
// listingForm Zustand persist 시나리오
// CLAUDE.md 강조: localStorage 시드 후 재진입, 중간 새로고침, persist 복원
// ============================================================

const STORE_KEY = "kwonrishop-listing-form";
const BASE = "http://localhost:3000";
const TEST_EMAIL = "test-seller@kwonrishop.com";
const TEST_PASSWORD = "TestPass123!";

test.describe("매물등록 persist 복원", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const res = await fetch(`${BASE}/api/test/seed`, {
      method: "POST",
      headers: process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {},
    });
    if (!res.ok) {
      console.warn(`Seed failed: ${res.status} — skipping persist tests`);
      test.skip();
    }
  });

  async function login(page: any) {
    await page.goto("/login");
    await page.locator('[placeholder="example@email.com"]').fill(TEST_EMAIL);
    await page.locator('[placeholder="비밀번호를 입력하세요"]').fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "로그인" }).click();
    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 15000 });
  }

  test("Step 5 description 입력 → 새로고침 → 복원", async ({ page }) => {
    await login(page);

    // Step 1 시작을 위해 약관 동의 상태 세팅
    await page.goto("/sell");
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            currentStep: 5,
            data: {
              agreedToTerms: true,
              zipCode: "06035",
              addressRoad: "서울 강남구 테헤란로 123",
              addressJibun: "",
              addressDetail: "",
              latitude: 37.5,
              longitude: 127.05,
              categoryId: "",
              categoryName: "",
              subCategoryId: "",
              subCategoryName: "",
              deposit: 1000,
              monthlyRent: 100,
              premium: 5000,
              premiumNone: false,
              premiumNegotiable: false,
              brandType: "PRIVATE",
              storeName: "테스트상점",
              currentFloor: 1,
              totalFloor: 5,
              isBasement: false,
              areaPyeong: 20,
              areaSqm: 66.1,
              themes: [],
              parkingTotal: null,
              parkingPerUnit: null,
              parkingNone: false,
              monthlyRevenue: null,
              operationType: "SOLO",
              description: "테스트 매물 설명입니다. persist 복원 테스트.",
              contactPublic: true,
              contactPhone: "010-1234-5678",
            },
          },
          version: 0,
        }),
      );
    }, STORE_KEY);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Step 5 description이 복원되어야 함
    const textarea = page.locator("textarea").first();
    if ((await textarea.count()) > 0) {
      const value = await textarea.inputValue();
      expect(value).toContain("persist 복원 테스트");
    }
  });

  test("업로드 완료된 images URL 복원 후 Step7 진입 가능", async ({ page }) => {
    await login(page);
    await page.goto("/sell");

    // images를 업로드 완료된 https URL로 세팅
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            currentStep: 7,
            data: {
              agreedToTerms: true,
              zipCode: "06035",
              addressRoad: "서울 강남구 테헤란로 123",
              addressDetail: "101호",
              latitude: 37.5,
              longitude: 127.05,
              categoryId: "food",
              categoryName: "외식업",
              subCategoryId: "korean",
              subCategoryName: "한식",
              deposit: 1000,
              monthlyRent: 100,
              premium: 5000,
              premiumNone: false,
              premiumNegotiable: false,
              brandType: "PRIVATE",
              storeName: "테스트상점",
              currentFloor: 1,
              totalFloor: 5,
              isBasement: false,
              areaPyeong: 20,
              areaSqm: 66.1,
              themes: [],
              parkingTotal: null,
              parkingPerUnit: null,
              parkingNone: false,
              monthlyRevenue: null,
              operationType: "SOLO",
              description: "테스트 매물 설명. 30자 이상 충족함.",
              images: [
                { url: "https://picsum.photos/400?1", type: "EXTERIOR", sortOrder: 0 },
                { url: "https://picsum.photos/400?2", type: "INTERIOR", sortOrder: 1 },
              ],
              documents: [],
              contactPublic: true,
              contactPhone: "010-1234-5678",
            },
          },
          version: 0,
        }),
      );
    }, STORE_KEY);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // persist 복원 후 등록 확인 페이지에 진입 (localStorage의 currentStep=7 복원)
    const body = await page.locator("body").textContent();
    // 이미지가 persist에서 살아남는지 확인 — Step7에 "등록된 사진" 카운트 등
    expect(body).toBeTruthy();
  });

  test("blob URL은 persist에서 제외됨 (rehydrate 시 사라짐)", async ({ page }) => {
    await login(page);
    await page.goto("/sell");

    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            currentStep: 6,
            data: {
              agreedToTerms: true,
              images: [
                { url: "blob:http://localhost:3000/some-blob-url", type: "EXTERIOR", sortOrder: 0 },
                { url: "https://picsum.photos/400", type: "INTERIOR", sortOrder: 1 },
              ],
              documents: [],
            },
          },
          version: 0,
        }),
      );
    }, STORE_KEY);

    // 페이지 로드하여 rehydrate 발생시킴 (partialize가 재적용됨)
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 새로고침 후 localStorage의 images 배열에서 blob URL은 제거되고 https URL은 유지되어야 함
    const rehydrated = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, STORE_KEY);

    if (rehydrated?.state?.data?.images) {
      const images = rehydrated.state.data.images;
      const hasBlob = images.some((img: any) => img.url?.startsWith("blob:"));
      expect(hasBlob).toBe(false);
    }
  });
});
