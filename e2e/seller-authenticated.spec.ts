import { test, expect, Page } from "@playwright/test";

// ============================================================
// 인증된 사장님(매도자) 전체 플로우 E2E 테스트
// 시드 유저 로그인 → 매물등록 7단계 → 마이페이지 → 통계 → 광고
// ============================================================

const TEST_EMAIL = "test-seller@kwonrishop.com";
const TEST_PASSWORD = "TestPass123!";
const BASE = "http://localhost:3000";

// 1x1 pixel PNG
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// ── Helpers ──

async function login(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  await page.locator('[placeholder="이메일"]').fill(TEST_EMAIL);
  await page.locator('[placeholder="비밀번호"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

async function injectDaumPostcode(page: Page) {
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>).daum = {
      Postcode: class {
        private opts: { oncomplete: (data: Record<string, string>) => void };
        constructor(opts: { oncomplete: (data: Record<string, string>) => void }) {
          this.opts = opts;
        }
        open() {
          this.opts.oncomplete({
            zonecode: "06035",
            roadAddress: "서울 강남구 테헤란로 123",
            jibunAddress: "서울 강남구 역삼동 123-45",
            autoJibunAddress: "서울 강남구 역삼동 123-45",
          });
        }
      },
    };
  });
}

// ── Tests ──

test.describe("인증된 사장님 전체 플로우", () => {
  // 동일 시드 유저를 사용하므로 직렬 실행 (동시 seed 호출 방지)
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const res = await fetch(`${BASE}/api/test/seed`, { method: "POST" });
    if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Seed returned failure");
  });

  // ─── 1. 로그인 ───
  test("사장님 이메일 로그인 성공", async ({ page }) => {
    await login(page);
    expect(page.url()).not.toContain("/login");
  });

  // ─── 2. 매물등록 7단계 위저드 ───
  test("매물등록 7단계 위저드 전체 완수", async ({ page }) => {
    // 업로드 API 모킹 (클라우드 스토리지 의존 제거)
    await page.route("**/api/upload", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: "/images/test-placeholder.png" }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route("**/api/upload/cleanup", (route) =>
      route.fulfill({ status: 200, body: "{}" })
    );

    await login(page);
    await page.goto("/sell");
    await page.waitForLoadState("domcontentloaded");

    // ── 약관 동의 ──
    await expect(page.getByText("공정거래를 위한 약속")).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "매물등록 시작하기" }).click();

    // ── Step 1: 위치정보 ──
    await expect(page.getByText("매물의 위치를 입력해주세요")).toBeVisible();
    await injectDaumPostcode(page);
    await page.getByText("클릭하여 주소 검색").click();
    await expect(page.getByText("도로명: 서울 강남구 테헤란로 123")).toBeVisible();
    await page.locator('[placeholder="건물명, 층수 등"]').fill("3층 301호");
    await page.getByRole("button", { name: "다음" }).click();

    // ── Step 2: 업종/금액 ──
    await expect(page.getByText(/업종이 어떻게 되시나요/)).toBeVisible();
    const catLabel = page.locator('label:has-text("업종 대분류")');
    await catLabel.waitFor({ timeout: 10000 });
    await catLabel.locator("..").locator("button").first().click();

    const subLabel = page.locator('label:has-text("세부 업종")');
    await subLabel.waitFor({ timeout: 5000 });
    await subLabel.locator("..").locator("button").first().click();

    await page.getByText("거래 금액 (만원)").waitFor();
    const numInputs = page.locator('input[placeholder="0"]');
    await numInputs.nth(0).fill("5000");
    await numInputs.nth(1).fill("150");
    await numInputs.nth(2).fill("3000");
    await page.getByRole("button", { name: "다음" }).click();

    // ── Step 3: 기본정보 ──
    await expect(page.getByText("매물의 기본 정보를 입력해주세요")).toBeVisible();
    await page.getByRole("button", { name: "개인매장" }).click();
    await page.locator('[placeholder="상호명을 입력하세요"]').fill("테스트카페 강남점");
    await page.locator('[placeholder="예: 1"]').fill("1");
    await page.locator('[placeholder="예: 5"]').fill("5");
    await page.locator('[placeholder="예: 15"]').fill("20");
    await page.getByRole("button", { name: "역세권" }).click();
    await page.getByRole("button", { name: "대로변" }).click();
    await page.getByRole("button", { name: "다음" }).click();

    // ── Step 4: 추가정보 ──
    await expect(page.getByText("매출/지출 정보를 입력하면")).toBeVisible();
    await page.locator('[placeholder="월 평균 매출 (최근 6개월)"]').fill("3000");
    await page.getByRole("button", { name: "혼자 운영" }).click();
    await page.getByRole("button", { name: "다음" }).click();

    // ── Step 5: 매물설명 ──
    await expect(page.getByText("매물에 대해 자유롭게 설명해주세요")).toBeVisible();
    await page.locator("textarea").fill(
      "테스트 매물입니다. 역세권 카페로 유동인구가 많고 인테리어 양호합니다. 단골 고객 다수."
    );
    await expect(page.getByText("조회수가 높아집니다")).toBeVisible();
    await page.getByRole("button", { name: "다음" }).click();

    // ── Step 6: 사진 / 연락처 ──
    await expect(page.getByText("매물 사진을 등록하고")).toBeVisible();
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles([
      { name: "exterior.png", mimeType: "image/png", buffer: PIXEL_PNG },
      { name: "interior.png", mimeType: "image/png", buffer: PIXEL_PNG },
    ]);
    await page.waitForTimeout(500);
    const selects = page.locator("select");
    if ((await selects.count()) >= 2) {
      await selects.nth(0).selectOption("EXTERIOR");
      await selects.nth(1).selectOption("INTERIOR");
    }
    const step6Next = page.getByRole("button", { name: "다음" });
    await expect(step6Next).toBeEnabled({ timeout: 3000 });
    await step6Next.click();

    // ── Step 7: 등록 확인 ──
    await expect(page.getByText("입력한 내용을 확인하고 등록해주세요")).toBeVisible();
    await expect(page.getByText("서울 강남구 테헤란로 123").first()).toBeVisible();
    await expect(page.getByText("테스트카페 강남점").first()).toBeVisible();

    await page.getByRole("button", { name: "매물 등록하기" }).click();

    // ── 성공 모달 ──
    await expect(page.getByText("매물 등록 완료!")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("매물이 성공적으로 등록되었습니다")).toBeVisible();
    await expect(page.getByRole("button", { name: "광고 상품 보기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "내 매물 보기" })).toBeVisible();

    await page.getByRole("button", { name: "내 매물 보기" }).click();
    await page.waitForURL(/\/listings\//, { timeout: 10000 });
    await expect(page.getByText("테스트카페 강남점")).toBeVisible({ timeout: 10000 });
  });

  // ─── 3. 마이페이지 ───
  test("마이페이지 대시보드 사장님 정보 표시", async ({ page }) => {
    await login(page);
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("테스트사장님")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
    await expect(page.getByText(/사장님|SELLER/i).first()).toBeVisible();
    await expect(page.getByText("로그아웃")).toBeVisible();
  });

  // ─── 4. 통계 페이지 ───
  test("통계 페이지 정상 로드", async ({ page }) => {
    await login(page);
    await page.goto("/mypage/stats");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText(/조회수|통계|매물이 없|등록된 매물/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 5. 광고관리 페이지 ───
  test("광고관리 페이지 정상 로드", async ({ page }) => {
    await login(page);
    await page.goto("/mypage/ads");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText(/광고 관리|광고|구매|내역|결제/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. 요금제 페이지 (인증 상태) ───
  test("요금제 페이지 상품 표시", async ({ page }) => {
    await login(page);
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");

    await expect(
      page.getByText(/요금|광고 상품|프리미엄/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 7. 매물수정 페이지 ───
  test("매물수정 페이지 접근", async ({ page }) => {
    await login(page);
    await page.goto("/sell/edit");
    await page.waitForLoadState("domcontentloaded");

    // 매물이 있으면 수정 폼, 없으면 안내 메시지, 또는 마이페이지로 리다이렉트
    await page.waitForTimeout(2000);
    const hasEdit = await page.getByText(/매물 수정|수정할 매물/).first().isVisible().catch(() => false);
    const noListing = await page.getByText(/매물이 없|등록된 매물이 없|로딩/).first().isVisible().catch(() => false);
    expect(hasEdit || noListing || page.url().includes("/mypage")).toBeTruthy();
  });

  // ─── 8. 로그아웃 ───
  test("로그아웃 후 로그인 페이지 이동", async ({ page }) => {
    await login(page);
    await page.goto("/mypage");
    await page.waitForLoadState("domcontentloaded");
    await page.getByText("테스트사장님").waitFor({ timeout: 10000 });

    await page.getByText("로그아웃").click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname.includes("/login"), { timeout: 10000 });
  });

  // ─── 9. 접근 보호 ───
  test("비인증: /sell → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/sell");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("비인증: /mypage → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("비인증: /sell/edit → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/sell/edit");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });

  test("비인증: /mypage/stats → 로그인 리다이렉트", async ({ page }) => {
    await page.goto("/mypage/stats");
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});
