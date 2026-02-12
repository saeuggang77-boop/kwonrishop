import { describe, it, expect } from "vitest";
import {
  confirmPaymentSchema,
  purchaseReportSchema,
  createSubscriptionSchema,
  createPaymentSchema,
} from "./payment";

describe("confirmPaymentSchema", () => {
  it("validates valid input", () => {
    const validInput = {
      paymentKey: "payment_key_abc123",
      orderId: "order123456",
      amount: 100000,
    };
    expect(confirmPaymentSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects empty paymentKey", () => {
    const input = {
      paymentKey: "",
      orderId: "order123456",
      amount: 100000,
    };
    expect(() => confirmPaymentSchema.parse(input)).toThrow();
  });

  it("rejects orderId that is too short", () => {
    const input = {
      paymentKey: "payment_key_abc123",
      orderId: "12345", // 5자
      amount: 100000,
    };
    expect(() => confirmPaymentSchema.parse(input)).toThrow();
  });

  it("rejects orderId that is too long", () => {
    const input = {
      paymentKey: "payment_key_abc123",
      orderId: "x".repeat(65), // 65자
      amount: 100000,
    };
    expect(() => confirmPaymentSchema.parse(input)).toThrow();
  });

  it("accepts orderId at exactly 6 characters", () => {
    const input = {
      paymentKey: "payment_key_abc123",
      orderId: "123456", // 정확히 6자
      amount: 100000,
    };
    const result = confirmPaymentSchema.parse(input);
    expect(result.orderId).toBe("123456");
  });

  it("accepts orderId at exactly 64 characters", () => {
    const input = {
      paymentKey: "payment_key_abc123",
      orderId: "x".repeat(64), // 정확히 64자
      amount: 100000,
    };
    const result = confirmPaymentSchema.parse(input);
    expect(result.orderId.length).toBe(64);
  });

  it("rejects zero or negative amount", () => {
    const zeroAmount = {
      paymentKey: "payment_key_abc123",
      orderId: "order123456",
      amount: 0,
    };
    expect(() => confirmPaymentSchema.parse(zeroAmount)).toThrow();

    const negativeAmount = {
      paymentKey: "payment_key_abc123",
      orderId: "order123456",
      amount: -1000,
    };
    expect(() => confirmPaymentSchema.parse(negativeAmount)).toThrow();
  });

  it("rejects non-integer amount", () => {
    const input = {
      paymentKey: "payment_key_abc123",
      orderId: "order123456",
      amount: 100.5,
    };
    expect(() => confirmPaymentSchema.parse(input)).toThrow();
  });
});

describe("purchaseReportSchema", () => {
  it("validates valid listingId", () => {
    const validInput = { listingId: "listing-123" };
    const result = purchaseReportSchema.parse(validInput);
    expect(result.listingId).toBe("listing-123");
  });

  it("rejects empty listingId", () => {
    const input = { listingId: "" };
    expect(() => purchaseReportSchema.parse(input)).toThrow();
  });

  it("rejects missing listingId", () => {
    const input = {};
    expect(() => purchaseReportSchema.parse(input)).toThrow();
  });
});

describe("createSubscriptionSchema", () => {
  it("validates PRO tier", () => {
    const input = { tier: "PRO" };
    const result = createSubscriptionSchema.parse(input);
    expect(result.tier).toBe("PRO");
  });

  it("validates PREMIUM tier", () => {
    const input = { tier: "PREMIUM" };
    const result = createSubscriptionSchema.parse(input);
    expect(result.tier).toBe("PREMIUM");
  });

  it("rejects invalid tier", () => {
    const input = { tier: "BASIC" };
    expect(() => createSubscriptionSchema.parse(input)).toThrow();
  });

  it("rejects missing tier", () => {
    const input = {};
    expect(() => createSubscriptionSchema.parse(input)).toThrow();
  });

  it("rejects lowercase tier", () => {
    const input = { tier: "pro" };
    expect(() => createSubscriptionSchema.parse(input)).toThrow();
  });
});

describe("createPaymentSchema", () => {
  it("validates PREMIUM_SUBSCRIPTION payment type", () => {
    const input = {
      paymentType: "PREMIUM_SUBSCRIPTION",
      tier: "PRO",
    };
    const result = createPaymentSchema.parse(input);
    expect(result.paymentType).toBe("PREMIUM_SUBSCRIPTION");
    expect(result.tier).toBe("PRO");
  });

  it("validates DEEP_REPORT payment type", () => {
    const input = {
      paymentType: "DEEP_REPORT",
      listingId: "listing-123",
    };
    const result = createPaymentSchema.parse(input);
    expect(result.paymentType).toBe("DEEP_REPORT");
    expect(result.listingId).toBe("listing-123");
  });

  it("validates FEATURED_LISTING payment type", () => {
    const input = {
      paymentType: "FEATURED_LISTING",
      listingId: "listing-456",
    };
    const result = createPaymentSchema.parse(input);
    expect(result.paymentType).toBe("FEATURED_LISTING");
  });

  it("validates ADVERTISEMENT payment type", () => {
    const input = {
      paymentType: "ADVERTISEMENT",
    };
    const result = createPaymentSchema.parse(input);
    expect(result.paymentType).toBe("ADVERTISEMENT");
  });

  it("accepts optional fields", () => {
    const input = {
      paymentType: "DEEP_REPORT",
      listingId: "listing-123",
      reportPlanId: "plan-456",
    };
    const result = createPaymentSchema.parse(input);
    expect(result.listingId).toBe("listing-123");
    expect(result.reportPlanId).toBe("plan-456");
  });

  it("rejects invalid payment type", () => {
    const input = {
      paymentType: "INVALID_TYPE",
    };
    expect(() => createPaymentSchema.parse(input)).toThrow();
  });

  it("rejects missing payment type", () => {
    const input = {
      tier: "PRO",
    };
    expect(() => createPaymentSchema.parse(input)).toThrow();
  });
});
