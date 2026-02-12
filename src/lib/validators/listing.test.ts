import { describe, it, expect } from "vitest";
import {
  createListingSchema,
  updateListingSchema,
  searchListingsSchema,
} from "./listing";

describe("createListingSchema", () => {
  it("validates valid input", () => {
    const validInput = {
      title: "강남역 맛집 권리 양도",
      description: "강남역 도보 5분 거리, 월 매출 5천만원 이상",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      monthlyRent: 3_000_000,
      address: "서울특별시 강남구 역삼동 123-45",
      city: "서울특별시",
      district: "강남구",
    };
    expect(createListingSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects title that is too short", () => {
    const input = {
      title: "짧", // 1자
      description: "충분히 긴 설명입니다.",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
    };
    expect(() => createListingSchema.parse(input)).toThrow("제목은 2자 이상");
  });

  it("rejects description that is too short", () => {
    const input = {
      title: "강남역 맛집",
      description: "짧은 설명", // 5자
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
    };
    expect(() => createListingSchema.parse(input)).toThrow("설명은 10자 이상");
  });

  it("rejects missing required fields", () => {
    const input = {
      title: "강남역 맛집",
      description: "충분히 긴 설명입니다.",
      // missing businessCategory, storeType, price, address, city, district
    };
    expect(() => createListingSchema.parse(input)).toThrow();
  });

  it("rejects negative price", () => {
    const input = {
      title: "강남역 맛집",
      description: "충분히 긴 설명입니다.",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: -1_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
    };
    expect(() => createListingSchema.parse(input)).toThrow("보증금을 입력해주세요");
  });

  it("validates email format", () => {
    const validInput = {
      title: "강남역 맛집",
      description: "충분히 긴 설명입니다.",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
      contactEmail: "invalid-email", // 잘못된 이메일
    };
    expect(() => createListingSchema.parse(validInput)).toThrow("올바른 이메일");
  });

  it("accepts valid email format", () => {
    const validInput = {
      title: "강남역 맛집",
      description: "충분히 긴 설명입니다.",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
      contactEmail: "contact@example.com",
    };
    const result = createListingSchema.parse(validInput);
    expect(result.contactEmail).toBe("contact@example.com");
  });

  it("accepts optional fields", () => {
    const input = {
      title: "강남역 맛집",
      description: "충분히 긴 설명입니다.",
      businessCategory: "KOREAN_FOOD",
      storeType: "GENERAL_STORE",
      price: 50_000_000,
      address: "서울특별시 강남구",
      city: "서울특별시",
      district: "강남구",
      monthlyRent: 3_000_000,
      premiumFee: 10_000_000,
      monthlyRevenue: 50_000_000,
      areaM2: 50.5,
      floor: 1,
    };
    const result = createListingSchema.parse(input);
    expect(result.monthlyRent).toBe(3_000_000);
    expect(result.premiumFee).toBe(10_000_000);
  });
});

describe("updateListingSchema", () => {
  it("accepts partial fields", () => {
    const input = { title: "수정된 제목" };
    const result = updateListingSchema.parse(input);
    expect(result.title).toBe("수정된 제목");
  });

  it("accepts empty object", () => {
    const input = {};
    const result = updateListingSchema.parse(input);
    expect(result).toEqual({});
  });

  it("validates partial fields correctly", () => {
    const input = { price: 100_000_000 };
    const result = updateListingSchema.parse(input);
    expect(result.price).toBe(100_000_000);
  });

  it("still validates email format when provided", () => {
    const input = { contactEmail: "invalid" };
    expect(() => updateListingSchema.parse(input)).toThrow("올바른 이메일");
  });
});

describe("searchListingsSchema", () => {
  it("applies default values", () => {
    const input = {};
    const result = searchListingsSchema.parse(input);
    expect(result.sortBy).toBe("createdAt");
    expect(result.sortOrder).toBe("desc");
    expect(result.limit).toBe(20);
  });

  it("coerces string numbers to numbers", () => {
    const input = {
      priceMin: "1000000" as any,
      priceMax: "5000000" as any,
      limit: "10" as any,
    };
    const result = searchListingsSchema.parse(input);
    expect(result.priceMin).toBe(1_000_000);
    expect(result.priceMax).toBe(5_000_000);
    expect(result.limit).toBe(10);
  });

  it("coerces string booleans to booleans", () => {
    const input = {
      premiumOnly: "true" as any,
      trustedOnly: "" as any, // empty string coerces to false
    };
    const result = searchListingsSchema.parse(input);
    expect(result.premiumOnly).toBe(true);
    expect(result.trustedOnly).toBe(false);
  });

  it("rejects invalid sortBy value", () => {
    const input = { sortBy: "invalidSort" };
    expect(() => searchListingsSchema.parse(input)).toThrow();
  });

  it("accepts valid sortBy values", () => {
    const validSortOptions = ["createdAt", "price", "viewCount", "favoriteCount", "monthlyRevenue", "monthlyProfit"];
    validSortOptions.forEach((sortBy) => {
      const result = searchListingsSchema.parse({ sortBy });
      expect(result.sortBy).toBe(sortBy);
    });
  });

  it("accepts optional search filters", () => {
    const input = {
      query: "강남역",
      businessCategory: "KOREAN_FOOD",
      city: "서울특별시",
      district: "강남구",
      priceMin: 10_000_000,
      priceMax: 100_000_000,
    };
    const result = searchListingsSchema.parse(input);
    expect(result.query).toBe("강남역");
    expect(result.businessCategory).toBe("KOREAN_FOOD");
    expect(result.priceMin).toBe(10_000_000);
  });

  it("enforces limit constraints", () => {
    const tooLarge = { limit: 100 };
    expect(() => searchListingsSchema.parse(tooLarge)).toThrow();

    const tooSmall = { limit: 0 };
    expect(() => searchListingsSchema.parse(tooSmall)).toThrow();

    const valid = { limit: 25 };
    const result = searchListingsSchema.parse(valid);
    expect(result.limit).toBe(25);
  });
});
