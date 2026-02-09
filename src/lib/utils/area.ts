const M2_TO_PYEONG = 3.3058;

/**
 * 제곱미터(m2)를 평으로 변환
 */
export function m2ToPyeong(m2: number): number {
  return Math.round((m2 / M2_TO_PYEONG) * 10) / 10;
}

/**
 * 평을 제곱미터(m2)로 변환
 */
export function pyeongToM2(pyeong: number): number {
  return Math.round(pyeong * M2_TO_PYEONG * 100) / 100;
}

/**
 * 면적을 포맷팅 (m2 + 평 병기)
 * 예: "84.5m² (25.6평)"
 */
export function formatArea(m2: number): string {
  const pyeong = m2ToPyeong(m2);
  return `${m2}m² (${pyeong}평)`;
}
