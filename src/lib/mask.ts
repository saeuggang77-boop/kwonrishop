/**
 * 전화번호 마스킹 유틸
 * - 로그인 회원: 전체 번호 노출 (원본)
 * - 비로그인 방문자: 중간 자리 마스킹 (010-****-5678)
 *
 * 서버에서 직접 가공하여 응답하므로 DevTools로 우회 불가
 */
export function maskPhone(
  phone: string | null | undefined,
  showFull: boolean,
): string | null {
  if (!phone) return null;
  if (showFull) return phone;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "***-****";

  // 서울(02) 10자리: 02-***-5678
  if (digits.startsWith("02") && digits.length === 10) {
    return `${digits.slice(0, 2)}-****-${digits.slice(-4)}`;
  }
  // 지역번호 10자리: 031-***-5678
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
  }
  // 휴대폰/일반 11자리: 010-****-5678
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
