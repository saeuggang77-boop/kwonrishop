/**
 * 게시글 제목 검증 (매물 / 집기 공통)
 *
 * 정책:
 *  - 5~30자
 *  - 양끝 공백 trim, 연속 공백은 1칸으로 normalize
 *  - 이모지 / 장식 기호 / 어그로 특수문자 차단
 *  - 한글, 영문, 숫자, 공백, 일반 문장부호(!?.,:;-~()[]/&+'") 허용
 */

const FORBIDDEN_PATTERNS: RegExp[] = [
  // 이모지 대표 범위
  /[\u{1F300}-\u{1F9FF}]/u,
  /[\u{1F600}-\u{1F64F}]/u,
  /[\u{2600}-\u{26FF}]/u,
  /[\u{2700}-\u{27BF}]/u,
  /[\u{1FA70}-\u{1FAFF}]/u,
  // 장식 기호
  /[★☆♥♡◆◇▲△▼▽※‼⚡♠♣♦♪♫❤]/,
  // 어그로 특수문자 (전각 포함)
  /[#@^*%＊＃]/,
];

export interface TitleValidation {
  ok: boolean;
  error?: string;
  sanitized?: string;
}

export const TITLE_MIN = 5;
export const TITLE_MAX = 30;

export function validatePostTitle(input: unknown): TitleValidation {
  if (typeof input !== "string") {
    return { ok: false, error: "제목을 입력해 주세요." };
  }
  const sanitized = input.trim().replace(/\s+/g, " ");

  if (sanitized.length === 0) {
    return { ok: false, error: "제목을 입력해 주세요." };
  }
  if (sanitized.length < TITLE_MIN) {
    return { ok: false, error: `제목은 ${TITLE_MIN}자 이상이어야 해요.` };
  }
  if (sanitized.length > TITLE_MAX) {
    return { ok: false, error: `제목은 ${TITLE_MAX}자 이내로 작성해 주세요.` };
  }
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        ok: false,
        error: "제목에 이모지나 ★ # @ * 등의 특수문자는 사용할 수 없어요.",
      };
    }
  }
  return { ok: true, sanitized };
}
