import { describe, it, expect } from "vitest";
import { m2ToPyeong, pyeongToM2, formatArea } from "./area";

describe("m2ToPyeong", () => {
  it("converts standard apartment sizes", () => {
    // 84m² ≈ 25.4평
    expect(m2ToPyeong(84)).toBeCloseTo(25.4, 0);
  });

  it("converts small sizes", () => {
    expect(m2ToPyeong(33)).toBeCloseTo(10.0, 0);
  });

  it("converts zero", () => {
    expect(m2ToPyeong(0)).toBe(0);
  });

  it("rounds to 1 decimal place", () => {
    const result = m2ToPyeong(100);
    expect(result.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(1);
  });
});

describe("pyeongToM2", () => {
  it("converts standard sizes", () => {
    // 25평 ≈ 82.6m²
    expect(pyeongToM2(25)).toBeCloseTo(82.6, 0);
  });

  it("converts zero", () => {
    expect(pyeongToM2(0)).toBe(0);
  });

  it("is inverse of m2ToPyeong (approximate)", () => {
    const original = 84;
    const pyeong = m2ToPyeong(original);
    const backToM2 = pyeongToM2(pyeong);
    expect(backToM2).toBeCloseTo(original, 0);
  });
});

describe("formatArea", () => {
  it("formats with both m2 and pyeong", () => {
    const result = formatArea(84);
    expect(result).toMatch(/84m²/);
    expect(result).toMatch(/평\)/);
  });

  it("matches expected pattern", () => {
    expect(formatArea(33)).toMatch(/^33m² \(\d+(\.\d)?평\)$/);
  });
});
