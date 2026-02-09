import { describe, it, expect } from "vitest";
import { buildReportMeta } from "./disclaimer";

describe("buildReportMeta", () => {
  it("returns default values when no overrides", () => {
    const meta = buildReportMeta();
    expect(meta.modelVersion).toBe("v1.0.0");
    expect(meta.dataSources).toHaveLength(4);
    expect(meta.modelAssumptions).toHaveLength(4);
    expect(meta.legalDisclaimer).toContain("법적 효력이 없습니다");
    expect(meta.generatedAt).toBeTruthy();
  });

  it("accepts overrides for individual fields", () => {
    const meta = buildReportMeta({
      modelVersion: "v2.0.0",
      dataSources: ["커스텀 출처"],
    });
    expect(meta.modelVersion).toBe("v2.0.0");
    expect(meta.dataSources).toEqual(["커스텀 출처"]);
    // Non-overridden fields keep defaults
    expect(meta.modelAssumptions).toHaveLength(4);
  });

  it("generatedAt is a valid ISO date", () => {
    const meta = buildReportMeta();
    const parsed = new Date(meta.generatedAt);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it("allows overriding generatedAt", () => {
    const customDate = "2026-01-01T00:00:00.000Z";
    const meta = buildReportMeta({ generatedAt: customDate });
    expect(meta.generatedAt).toBe(customDate);
  });
});
