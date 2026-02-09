import type { ReportMeta } from "@/types";

const MODEL_VERSION = "v1.0.0";

const LEGAL_DISCLAIMER = `본 보고서는 공개된 데이터와 통계 모델을 기반으로 작성된 참고용 자료이며, 법적 효력이 없습니다.
예측치는 추정치이며 실제 거래 결과와 다를 수 있습니다. 플랫폼은 매물의 정확성을 보증하지 않습니다.
중요한 의사결정 시 반드시 전문 법무사, 변호사, 또는 공인중개사의 검토를 받으시기 바랍니다.
본 서비스의 이용은 이용약관에 동의한 것으로 간주합니다.`;

const DEFAULT_DATA_SOURCES = [
  "등기부등본 공개정보",
  "국토교통부 실거래가 공개시스템",
  "플랫폼 내부 매물 데이터",
  "통계청 부동산 관련 통계",
];

const DEFAULT_MODEL_ASSUMPTIONS = [
  "최근 6개월 내 거래 데이터 기준",
  "동일 권리유형 및 부동산 유형 비교",
  "반경 3km 이내 유사매물 비교",
  "계절적 변동 미반영",
];

export function buildReportMeta(overrides?: Partial<ReportMeta>): ReportMeta {
  return {
    dataSources: overrides?.dataSources ?? DEFAULT_DATA_SOURCES,
    modelAssumptions: overrides?.modelAssumptions ?? DEFAULT_MODEL_ASSUMPTIONS,
    modelVersion: overrides?.modelVersion ?? MODEL_VERSION,
    generatedAt: overrides?.generatedAt ?? new Date().toISOString(),
    legalDisclaimer: overrides?.legalDisclaimer ?? LEGAL_DISCLAIMER,
  };
}
