/**
 * KRW 금액을 한국식으로 포맷팅
 * 예: 150000000 → "1억 5,000만원"
 *     35000000  → "3,500만원"
 *     5000000   → "500만원"
 *     300000    → "30만원"
 *     50000     → "5만원"
 */
export function formatKRW(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;

  if (num === 0) return "0원";

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const eok = Math.floor(absNum / 100_000_000);
  const man = Math.floor((absNum % 100_000_000) / 10_000);

  const parts: string[] = [];

  if (eok > 0) {
    parts.push(`${eok.toLocaleString("ko-KR")}억`);
  }

  if (man > 0) {
    parts.push(`${man.toLocaleString("ko-KR")}만`);
  }

  if (parts.length === 0) {
    return `${isNegative ? "-" : ""}${absNum.toLocaleString("ko-KR")}원`;
  }

  const remainder = absNum % 10_000;
  if (remainder > 0) {
    parts.push(`${remainder.toLocaleString("ko-KR")}`);
  }

  return `${isNegative ? "-" : ""}${parts.join(" ")}원`;
}

/**
 * 숫자를 만원 단위로 표시
 * 예: 150000000 → "15,000만원"
 */
export function formatManWon(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  const man = Math.round(num / 10_000);
  return `${man.toLocaleString("ko-KR")}만원`;
}

/**
 * 숫자를 콤마 포맷팅
 */
export function formatNumber(num: number | bigint): string {
  return Number(num).toLocaleString("ko-KR");
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 날짜를 한국식으로 포맷팅
 */
export function formatDateKR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 날짜+시간을 한국식으로 포맷팅
 */
export function formatDateTimeKR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 상대적 시간 표시 ("3분 전", "2시간 전", "어제")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  return formatDateKR(d);
}
