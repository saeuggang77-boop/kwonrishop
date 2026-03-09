// 국세청 사업자등록 진위확인 API
const NTS_API_URL =
  "https://api.odcloud.kr/api/nts-businessman/v1/validate";

interface NtsValidateRequest {
  b_no: string; // 사업자등록번호 (10자리, 하이픈 없이)
  start_dt: string; // 개업일자 (YYYYMMDD)
  p_nm: string; // 대표자성명
}

interface NtsValidateResponse {
  status_code: string;
  request_cnt: number;
  valid_cnt: number;
  data: Array<{
    b_no: string;
    valid: string; // "01" = 유효, "02" = 유효하지 않음
    valid_msg: string;
    request_param: {
      b_no: string;
      start_dt: string;
      p_nm: string;
    };
    status: {
      b_no: string;
      b_stt: string;
      b_stt_cd: string;
      tax_type: string;
      tax_type_cd: string;
      end_dt: string;
      utcc_yn: string;
      tax_type_change_dt: string;
      invoice_apply_dt: string;
      rbf_tax_type: string;
      rbf_tax_type_cd: string;
    };
  }>;
}

export async function validateBusiness(
  businessNumber: string,
  startDate: string,
  representativeName: string,
): Promise<{
  valid: boolean;
  message: string;
}> {
  const apiKey = process.env.NTS_API_KEY;

  if (!apiKey) {
    // 개발 환경에서 API 키 없을 때 테스트용
    if (process.env.NODE_ENV === "development") {
      return {
        valid: true,
        message: "[개발모드] API 키가 없어 인증을 건너뜁니다.",
      };
    }
    throw new Error("국세청 API 키가 설정되지 않았습니다.");
  }

  const cleanNumber = businessNumber.replace(/-/g, "");

  const body: { businesses: NtsValidateRequest[] } = {
    businesses: [
      {
        b_no: cleanNumber,
        start_dt: startDate,
        p_nm: representativeName,
      },
    ],
  };

  const res = await fetch(
    `${NTS_API_URL}?serviceKey=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    throw new Error(`국세청 API 호출 실패: ${res.status}`);
  }

  const data: NtsValidateResponse = await res.json();

  if (!data.data || data.data.length === 0) {
    return { valid: false, message: "조회 결과가 없습니다." };
  }

  const result = data.data[0];

  if (result.valid === "01") {
    return { valid: true, message: "사업자 인증이 완료되었습니다." };
  }

  return {
    valid: false,
    message: result.valid_msg || "사업자 정보가 일치하지 않습니다.",
  };
}
