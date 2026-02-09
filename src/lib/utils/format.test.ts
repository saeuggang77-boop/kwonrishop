import { describe, it, expect } from "vitest";
import {
  formatKRW,
  formatManWon,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "./format";

describe("formatKRW", () => {
  it("formats zero", () => {
    expect(formatKRW(0)).toBe("0원");
  });

  it("formats amounts under 만원", () => {
    expect(formatKRW(5000)).toBe("5,000원");
  });

  it("formats 만원 단위", () => {
    expect(formatKRW(50_000)).toBe("5만원");
    expect(formatKRW(300_000)).toBe("30만원");
    expect(formatKRW(5_000_000)).toBe("500만원");
    expect(formatKRW(35_000_000)).toBe("3,500만원");
  });

  it("formats 억원 단위", () => {
    expect(formatKRW(100_000_000)).toBe("1억원");
    expect(formatKRW(500_000_000)).toBe("5억원");
  });

  it("formats 억+만원 혼합", () => {
    expect(formatKRW(150_000_000)).toBe("1억 5,000만원");
    expect(formatKRW(1_230_000_000)).toBe("12억 3,000만원");
  });

  it("formats 억+만+원 혼합", () => {
    expect(formatKRW(150_005_000)).toBe("1억 5,000만 5,000원");
  });

  it("handles bigint", () => {
    expect(formatKRW(BigInt(150_000_000))).toBe("1억 5,000만원");
  });

  it("handles negative amounts", () => {
    expect(formatKRW(-50_000)).toBe("-5만원");
    expect(formatKRW(-150_000_000)).toBe("-1억 5,000만원");
  });
});

describe("formatManWon", () => {
  it("formats to 만원 단위", () => {
    expect(formatManWon(150_000_000)).toBe("15,000만원");
    expect(formatManWon(50_000)).toBe("5만원");
  });
});

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("handles bigint", () => {
    expect(formatNumber(BigInt(1000))).toBe("1,000");
  });
});

describe("formatPercent", () => {
  it("formats percentage with default decimals", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
  });

  it("formats percentage with custom decimals", () => {
    expect(formatPercent(12.345, 2)).toBe("12.35%");
    expect(formatPercent(100, 0)).toBe("100%");
  });
});

describe("formatRelativeTime", () => {
  it("shows '방금 전' for < 60 seconds", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("방금 전");
  });

  it("shows minutes for < 60 minutes", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe("5분 전");
  });

  it("shows hours for < 24 hours", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe("3시간 전");
  });

  it("shows days for < 7 days", () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe("2일 전");
  });

  it("shows weeks for < 30 days", () => {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe("2주 전");
  });

  it("accepts string dates", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("방금 전");
  });
});
