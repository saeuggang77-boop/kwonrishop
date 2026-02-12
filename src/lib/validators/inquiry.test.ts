import { describe, it, expect } from "vitest";
import {
  createInquirySchema,
  updateInquiryStatusSchema,
} from "./inquiry";

describe("createInquirySchema", () => {
  it("validates valid input", () => {
    const validInput = {
      listingId: "listing-123",
      message: "이 매물에 대해 문의드립니다. 현재 운영 중인가요?",
      senderName: "홍길동",
      senderPhone: "010-1234-5678",
    };
    expect(createInquirySchema.parse(validInput)).toEqual(validInput);
  });

  it("accepts minimal required fields", () => {
    const minimalInput = {
      listingId: "listing-123",
      message: "문의드립니다. 궁금한 점이 있습니다.",
    };
    const result = createInquirySchema.parse(minimalInput);
    expect(result.listingId).toBe("listing-123");
    expect(result.message).toBe("문의드립니다. 궁금한 점이 있습니다.");
  });

  it("rejects empty listingId", () => {
    const input = {
      listingId: "",
      message: "문의드립니다. 궁금한 점이 있습니다.",
    };
    expect(() => createInquirySchema.parse(input)).toThrow("매물 ID가 필요합니다");
  });

  it("rejects missing listingId", () => {
    const input = {
      message: "문의드립니다. 궁금한 점이 있습니다.",
    };
    expect(() => createInquirySchema.parse(input)).toThrow();
  });

  it("rejects message that is too short", () => {
    const input = {
      listingId: "listing-123",
      message: "짧은 문의", // 5자
    };
    expect(() => createInquirySchema.parse(input)).toThrow("문의 내용은 10자 이상");
  });

  it("rejects message that is too long", () => {
    const input = {
      listingId: "listing-123",
      message: "x".repeat(1001), // 1001자
    };
    expect(() => createInquirySchema.parse(input)).toThrow("문의 내용은 1000자 이하");
  });

  it("accepts message at exactly 10 characters", () => {
    const input = {
      listingId: "listing-123",
      message: "1234567890", // 정확히 10자
    };
    const result = createInquirySchema.parse(input);
    expect(result.message).toBe("1234567890");
  });

  it("accepts message at exactly 1000 characters", () => {
    const input = {
      listingId: "listing-123",
      message: "x".repeat(1000), // 정확히 1000자
    };
    const result = createInquirySchema.parse(input);
    expect(result.message.length).toBe(1000);
  });

  it("accepts optional sender fields", () => {
    const input = {
      listingId: "listing-123",
      message: "문의드립니다. 궁금한 점이 있습니다.",
      senderName: "홍길동",
    };
    const result = createInquirySchema.parse(input);
    expect(result.senderName).toBe("홍길동");
    expect(result.senderPhone).toBeUndefined();
  });
});

describe("updateInquiryStatusSchema", () => {
  it("validates PENDING status", () => {
    const input = { status: "PENDING" };
    const result = updateInquiryStatusSchema.parse(input);
    expect(result.status).toBe("PENDING");
  });

  it("validates REPLIED status", () => {
    const input = { status: "REPLIED" };
    const result = updateInquiryStatusSchema.parse(input);
    expect(result.status).toBe("REPLIED");
  });

  it("validates CANCELLED status", () => {
    const input = { status: "CANCELLED" };
    const result = updateInquiryStatusSchema.parse(input);
    expect(result.status).toBe("CANCELLED");
  });

  it("rejects invalid status", () => {
    const input = { status: "INVALID_STATUS" };
    expect(() => updateInquiryStatusSchema.parse(input)).toThrow();
  });

  it("rejects missing status", () => {
    const input = {};
    expect(() => updateInquiryStatusSchema.parse(input)).toThrow();
  });

  it("rejects lowercase status", () => {
    const input = { status: "pending" };
    expect(() => updateInquiryStatusSchema.parse(input)).toThrow();
  });
});
