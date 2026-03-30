// 국세청 사업자등록 진위확인 API (사업자번호 + 대표자명 + 개업일 3개 대조)
const NTS_VALIDATE_URL =
  "https://api.odcloud.kr/api/nts-businessman/v1/validate";

interface NtsValidateResponse {
  status_code: string;
  request_cnt: number;
  valid_cnt: number;
  data: Array<{
    b_no: string;
    valid: string; // "01" = 일치, "02" = 불일치
    valid_msg: string;
    request_param: {
      b_no: string;
      start_dt: string;
      p_nm: string;
      b_nm: string;
    };
    status: {
      b_no: string;
      b_stt: string; // "계속사업자", "휴업자", "폐업자"
      b_stt_cd: string; // "01" = 계속, "02" = 휴업, "03" = 폐업
      tax_type: string;
      tax_type_cd: string;
      end_dt: string;
      utcc_yn: string;
      tax_type_change_dt: string;
      invoice_apply_dt: string;
    };
  }>;
}

export async function validateBusiness(
  businessNumber: string,
  representativeName: string,
  openDate: string,
  businessName?: string,
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
  const cleanDate = openDate.replace(/-/g, "");

  const res = await fetch(
    `${NTS_VALIDATE_URL}?serviceKey=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businesses: [
          {
            b_no: cleanNumber,
            start_dt: cleanDate,
            p_nm: representativeName,
            b_nm: "",
          },
        ],
      }),
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

  // 진위확인 결과: "02" = 불일치
  if (result.valid === "02") {
    return {
      valid: false,
      message: "사업자 정보가 일치하지 않습니다. 사업자등록번호, 대표자명, 개업일자를 정확히 입력해주세요.",
    };
  }

  // 진위확인 통과 ("01") → 사업 상태 추가 확인
  if (result.valid === "01") {
    const status = result.status;

    // 계속사업자(01)만 인증 통과
    if (status?.b_stt_cd === "01") {
      return {
        valid: true,
        message: `사업자 인증이 완료되었습니다. (${status.b_stt}, ${status.tax_type})`,
      };
    }

    // 휴업자(02)
    if (status?.b_stt_cd === "02") {
      return {
        valid: false,
        message: "휴업 상태인 사업자입니다. 계속사업자만 등록 가능합니다.",
      };
    }

    // 폐업자(03)
    if (status?.b_stt_cd === "03") {
      return {
        valid: false,
        message: `폐업된 사업자입니다. (폐업일: ${status.end_dt || "미상"})`,
      };
    }
  }

  return {
    valid: false,
    message: "등록되지 않은 사업자등록번호입니다.",
  };
}
