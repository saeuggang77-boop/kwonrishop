import { describe, it, expect } from "vitest";
import {
  RIGHTS_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  LISTING_STATUS_LABELS,
  SUBSCRIPTION_PRICES,
  DEEP_REPORT_PRICE,
  MAX_IMAGES_PER_LISTING,
  ALLOWED_IMAGE_TYPES,
} from "./constants";

describe("Constants", () => {
  it("RIGHTS_CATEGORY_LABELS has all expected categories", () => {
    expect(RIGHTS_CATEGORY_LABELS.JEONSE).toBe("전세권");
    expect(RIGHTS_CATEGORY_LABELS.MORTGAGE).toBe("저당권/근저당권");
    expect(RIGHTS_CATEGORY_LABELS.AUCTION).toBe("경매");
    expect(Object.keys(RIGHTS_CATEGORY_LABELS).length).toBeGreaterThan(5);
  });

  it("PROPERTY_TYPE_LABELS covers common property types", () => {
    expect(PROPERTY_TYPE_LABELS.APARTMENT).toBe("아파트");
    expect(PROPERTY_TYPE_LABELS.OFFICETEL).toBe("오피스텔");
  });

  it("LISTING_STATUS_LABELS has complete status set", () => {
    expect(LISTING_STATUS_LABELS.ACTIVE).toBe("활성");
    expect(LISTING_STATUS_LABELS.SOLD).toBe("거래완료");
    expect(LISTING_STATUS_LABELS.PENDING_VERIFICATION).toBe("검증 대기");
  });

  it("SUBSCRIPTION_PRICES are correct", () => {
    expect(SUBSCRIPTION_PRICES.FREE).toBe(0);
    expect(SUBSCRIPTION_PRICES.BASIC).toBe(29_000);
    expect(SUBSCRIPTION_PRICES.PREMIUM).toBe(79_000);
  });

  it("DEEP_REPORT_PRICE is set", () => {
    expect(DEEP_REPORT_PRICE).toBe(39_000);
  });

  it("MAX_IMAGES_PER_LISTING is reasonable", () => {
    expect(MAX_IMAGES_PER_LISTING).toBe(20);
  });

  it("ALLOWED_IMAGE_TYPES includes standard formats", () => {
    expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
    expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
  });
});
