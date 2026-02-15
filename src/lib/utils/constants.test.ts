import { describe, it, expect } from "vitest";
import {
  BUSINESS_CATEGORY_LABELS,
  STORE_TYPE_LABELS,
  LISTING_STATUS_LABELS,
  REPORT_PLANS,
  SELLER_AD_PLANS,
  MAX_IMAGES_PER_LISTING,
  ALLOWED_IMAGE_TYPES,
  SORT_OPTIONS,
  REGIONS,
} from "./constants";

describe("Constants", () => {
  it("BUSINESS_CATEGORY_LABELS has all expected categories", () => {
    expect(BUSINESS_CATEGORY_LABELS.KOREAN_FOOD).toBe("한식");
    expect(BUSINESS_CATEGORY_LABELS.CAFE_BAKERY).toBe("카페/베이커리");
    expect(BUSINESS_CATEGORY_LABELS.CHICKEN).toBe("치킨");
    expect(Object.keys(BUSINESS_CATEGORY_LABELS).length).toBeGreaterThan(10);
  });

  it("STORE_TYPE_LABELS covers common store types", () => {
    expect(STORE_TYPE_LABELS.GENERAL_STORE).toBe("일반상가");
    expect(STORE_TYPE_LABELS.FRANCHISE).toBe("프랜차이즈");
  });

  it("LISTING_STATUS_LABELS has complete status set", () => {
    expect(LISTING_STATUS_LABELS.ACTIVE).toBe("활성");
    expect(LISTING_STATUS_LABELS.SOLD).toBe("거래완료");
    expect(LISTING_STATUS_LABELS.PENDING_VERIFICATION).toBe("검증 대기");
  });

  it("REPORT_PLANS has single plan at 30,000", () => {
    expect(REPORT_PLANS).toHaveLength(1);
    expect(REPORT_PLANS[0].price).toBe(30_000);
  });

  it("SELLER_AD_PLANS has PREMIUM and VIP tiers", () => {
    expect(SELLER_AD_PLANS).toHaveLength(2);
    expect(SELLER_AD_PLANS[0].tier).toBe("PREMIUM");
    expect(SELLER_AD_PLANS[0].price).toBe(200_000);
    expect(SELLER_AD_PLANS[1].tier).toBe("VIP");
    expect(SELLER_AD_PLANS[1].price).toBe(300_000);
  });

  it("MAX_IMAGES_PER_LISTING is reasonable", () => {
    expect(MAX_IMAGES_PER_LISTING).toBe(20);
  });

  it("ALLOWED_IMAGE_TYPES includes standard formats", () => {
    expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
  });

  it("SORT_OPTIONS has store-specific options", () => {
    const values = SORT_OPTIONS.map((o) => o.value);
    expect(values).toContain("monthlyRevenue-desc");
    expect(values).toContain("monthlyProfit-desc");
    expect(values).toContain("favoriteCount-desc");
  });

  it("REGIONS includes major cities", () => {
    expect(Object.keys(REGIONS)).toContain("서울특별시");
    expect(Object.keys(REGIONS)).toContain("경기도");
    expect(REGIONS["서울특별시"]).toContain("강남구");
  });
});
