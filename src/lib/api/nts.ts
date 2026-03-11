// 국세청 사업자등록 상태조회 API
const NTS_STATUS_URL =
  "https://api.odcloud.kr/api/nts-businessman/v1/status";

interface NtsStatusResponse {
  request_cnt: number;
  match_cnt: number;
  status_code: string;
  data: Array<{
    b_no: string;
    b_stt: string; // "계속사업자", "휴업자", "폐업자"
    b_stt_cd: string; // "01" = 계속, "02" = 휴업, "03" = 폐업
    tax_type: string;
    tax_type_cd: string;
    end_dt: string;
    utcc_yn: string;
    tax_type_change_dt: string;
    invoice_apply_dt: string;
    rbf_tax_type: string;
    rbf_tax_type_cd: string;
  }>;
}

export async function validateBusiness(
  businessNumber: string,
): Promise<{
  valid: boolean;
  message: string;
}> {
  const apiKey = process.env.NTS_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      return {
        valid: true,
        message: "[개발모드] API 키가 없어 인증을 건너뜁니다.",
      };
    }
    throw new Error("국세청 API 키가 설정되지 않았습니다.");
  }

  const cleanNumber = businessNumber.replace(/-/g, "");

  // 사업자번호 상태조회 API 사용 (진위확인보다 안정적)
  const res = await fetch(
    `${NTS_STATUS_URL}?serviceKey=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ b_no: [cleanNumber] }),
    },
  );

  if (!res.ok) {
    throw new Error(`국세청 API 호출 실패: ${res.status}`);
  }

  const data: NtsStatusResponse = await res.json();

  if (!data.data || data.data.length === 0) {
    return { valid: false, message: "조회 결과가 없습니다." };
  }

  const result = data.data[0];

  // 계속사업자(01)만 인증 통과
  if (result.b_stt_cd === "01") {
    return {
      valid: true,
      message: `사업자 인증이 완료되었습니다. (${result.b_stt}, ${result.tax_type})`,
    };
  }

  // 휴업자(02)
  if (result.b_stt_cd === "02") {
    return {
      valid: false,
      message: "휴업 상태인 사업자입니다. 계속사업자만 등록 가능합니다.",
    };
  }

  // 폐업자(03)
  if (result.b_stt_cd === "03") {
    return {
      valid: false,
      message: `폐업된 사업자입니다. (폐업일: ${result.end_dt || "미상"})`,
    };
  }

  return {
    valid: false,
    message: "등록되지 않은 사업자등록번호입니다.",
  };
}
