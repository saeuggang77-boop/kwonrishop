/**
 * 공정거래위원회 정보공개서 API 클라이언트
 * API Base: https://franchise.ftc.go.kr/api/search.do
 * - type=list: 정보공개서 목록 (XML)
 * - type=content: 정보공개서 본문 (HTML)
 *
 * Referer 헤더 필수: https://franchise.ftc.go.kr/
 */

const FTC_DISCLOSURE_BASE = "https://franchise.ftc.go.kr/api/search.do";
const FTC_DISCLOSURE_KEY = process.env.FTC_DISCLOSURE_API_KEY || "";

const REQUIRED_HEADERS: Record<string, string> = {
  "Referer": "https://franchise.ftc.go.kr/",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept-Encoding": "gzip, deflate",
};

export interface DisclosureListItem {
  jngIfrmpSn: string;   // 정보공개서 일련번호
  corpNm: string;       // 법인명
  brandNm: string;      // 브랜드명
  brno: string;         // 사업자등록번호
  jngIfrmpRgsno: string; // 정보공개서 등록번호
}

export interface DisclosureParsedData {
  representativeName?: string;  // 대표자명
  representativePhone?: string; // 대표전화번호
  franchiseFee?: number;        // 가맹비/가입비 (천원)
  educationFee?: number;        // 교육비/최초교육비 (천원)
  depositFee?: number;          // 계약이행보증금 (천원)
}

/**
 * 정보공개서 목록 조회 (XML)
 */
export async function listDisclosures(
  yr: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ items: DisclosureListItem[]; totalCount: number }> {
  if (!FTC_DISCLOSURE_KEY) {
    console.error("[FTC Disclosure] API key not configured");
    return { items: [], totalCount: 0 };
  }

  try {
    const url = `${FTC_DISCLOSURE_BASE}?type=list&yr=${yr}&serviceKey=${encodeURIComponent(FTC_DISCLOSURE_KEY)}&pageNo=${page}&numOfRows=${pageSize}&viewType=xml`;

    const res = await fetch(url, {
      headers: REQUIRED_HEADERS,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xml = await res.text();

    // Parse totalCount
    const totalMatch = xml.match(/<totalCount>(\d+)<\/totalCount>/);
    const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;

    // Parse items
    const items: DisclosureListItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      items.push({
        jngIfrmpSn: extractXmlTag(itemXml, "jngIfrmpSn"),
        corpNm: extractXmlTag(itemXml, "corpNm"),
        brandNm: extractXmlTag(itemXml, "brandNm"),
        brno: extractXmlTag(itemXml, "brno"),
        jngIfrmpRgsno: extractXmlTag(itemXml, "jngIfrmpRgsno"),
      });
    }

    return { items, totalCount };
  } catch (error) {
    console.error("[FTC Disclosure] List API error:", error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * 정보공개서 본문 HTML 가져오기 + 파싱
 */
export async function getDisclosureContent(
  jngIfrmpSn: string
): Promise<DisclosureParsedData | null> {
  if (!FTC_DISCLOSURE_KEY) {
    return null;
  }

  try {
    const url = `${FTC_DISCLOSURE_BASE}?type=content&jngIfrmpSn=${jngIfrmpSn}&serviceKey=${encodeURIComponent(FTC_DISCLOSURE_KEY)}`;

    const res = await fetch(url, {
      headers: REQUIRED_HEADERS,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    if (!html || html.length < 100) {
      return null;
    }

    return parseDisclosureHtml(html);
  } catch (error) {
    console.error(`[FTC Disclosure] Content API error (sn=${jngIfrmpSn}):`, error);
    return null;
  }
}

/**
 * 정보공개서 HTML에서 핵심 데이터 추출
 */
function parseDisclosureHtml(html: string): DisclosureParsedData {
  const result: DisclosureParsedData = {};

  try {
    // 1. 대표자명 + 대표전화번호
    // 패턴: 헤더행에 [법인설립등기일, 사업자등록일, 대표자, 대표전화번호, 대표팩스번호]
    //        값 행에 [개인사업자, 날짜, 이름, 전화번호, -]
    const repIdx = html.indexOf("대표자</span>");
    if (repIdx >= 0) {
      const trStart = html.lastIndexOf("<tr", repIdx);
      const trEnd = html.indexOf("</tr>", repIdx);
      if (trStart >= 0 && trEnd >= 0) {
        // 헤더행의 라벨들
        const headerRow = html.substring(trStart, trEnd);
        const headerLabels = extractSpanTexts(headerRow);

        // 값 행 (다음 <tr>)
        const nextTrStart = html.indexOf("<tr", trEnd);
        const nextTrEnd = html.indexOf("</tr>", nextTrStart + 1);
        if (nextTrStart >= 0 && nextTrEnd >= 0) {
          const valueRow = html.substring(nextTrStart, nextTrEnd);
          const values = extractSpanTexts(valueRow);

          // 대표자 위치 찾기
          const repColIdx = headerLabels.findIndex((l) =>
            l.replace(/\s/g, "") === "대표자"
          );
          if (repColIdx >= 0 && values[repColIdx]) {
            const name = values[repColIdx].trim();
            // 유효한 이름인지 검증 (최소 2자, 한글/영문 포함)
            if (name && name !== "-" && name !== "없음" && name.length >= 2 && /[가-힣a-zA-Z]/.test(name)) {
              result.representativeName = stripControlChars(name);
            }
          }

          // 대표전화번호 위치 찾기
          const phoneColIdx = headerLabels.findIndex((l) =>
            l.replace(/\s/g, "").includes("대표전화")
          );
          if (phoneColIdx >= 0 && values[phoneColIdx]) {
            const phone = values[phoneColIdx].trim();
            if (phone && phone !== "-" && phone !== "없음") {
              result.representativePhone = stripControlChars(phone);
            }
          }
        }
      }
    }

    // 2. 가맹비 / 가입비
    result.franchiseFee = extractFeeFromRow(html, ["가맹비", "가입비"]);

    // 3. 교육비 / 최초교육비
    result.educationFee = extractFeeFromRow(html, ["최초교육비", "교육비"]);

    // 4. 계약이행보증금
    result.depositFee = extractFeeFromRow(html, ["계약이행보증금"]);
  } catch (error) {
    console.error("[FTC Disclosure] HTML parsing error:", error);
  }

  return result;
}

/**
 * HTML 테이블 행에서 비용 금액 추출
 * 라벨 셀 다음 셀에 금액이 있는 패턴
 */
function extractFeeFromRow(html: string, labels: string[]): number | undefined {
  for (const label of labels) {
    // 라벨의 <span> 태그 찾기
    const patterns = [
      `>${label}</span>`,
      `>${label}<`,
    ];

    for (const pattern of patterns) {
      const idx = html.indexOf(pattern);
      if (idx < 0) continue;

      // 이 라벨이 속한 <tr> 찾기
      const trStart = html.lastIndexOf("<tr", idx);
      const trEnd = html.indexOf("</tr>", idx);
      if (trStart < 0 || trEnd < 0) continue;

      const row = html.substring(trStart, trEnd);
      const spans = extractSpanTexts(row);

      // 라벨 위치 찾기 (부분 매칭 - "계약이행보증금(부가세 없음)" 등 대응)
      const labelIdx = spans.findIndex((s) =>
        s.replace(/[\s\u00a0]/g, "").startsWith(label)
      );

      if (labelIdx >= 0 && spans[labelIdx + 1]) {
        const valueText = spans[labelIdx + 1].replace(/[\s\u00a0]/g, "");
        const num = parseKoreanNumber(valueText);
        if (num !== undefined) {
          return num;
        }
      }
    }
  }
  return undefined;
}

/**
 * <span> 태그 내 텍스트 추출
 */
function extractSpanTexts(html: string): string[] {
  const regex = /<span[^>]*>([^<]*)<\/span>/g;
  const texts: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].trim();
    if (text) {
      texts.push(text);
    }
  }
  return texts;
}

/**
 * 숫자 문자열 파싱 (천원 단위)
 * "11,000" → 11000, "없음" → undefined, "-" → undefined, "0" → 0
 */
function parseKoreanNumber(text: string): number | undefined {
  const cleaned = text.replace(/,/g, "").replace(/[\s\u00a0]/g, "");

  if (!cleaned || cleaned === "-" || cleaned === "없음") {
    return undefined;
  }

  const num = parseInt(cleaned, 10);
  if (isNaN(num)) {
    return undefined;
  }

  return num;
}

/**
 * XML 태그 값 추출
 */
function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * 전체 연도별 정보공개서 동기화
 * 2024~2019 연도 순으로 조회, corpNm+brandNm으로 DB 매칭
 */
export async function syncAllDisclosures(
  prismaClient: any,
  options?: {
    years?: string[];
    delayMs?: number;
    onProgress?: (msg: string) => void;
    maxContentFetch?: number;
  }
): Promise<{ matched: number; contentParsed: number; errors: number }> {
  const years = options?.years || ["2024", "2023", "2022", "2021", "2020", "2019"];
  const delayMs = options?.delayMs || 500;
  const maxContentFetch = options?.maxContentFetch || 100;
  const log = options?.onProgress || console.log;

  let matched = 0;
  let contentParsed = 0;
  let errors = 0;

  for (const yr of years) {
    try {
      let page = 1;
      let totalPages = 1;

      do {
        const { items, totalCount } = await listDisclosures(yr, page, 100);
        totalPages = Math.ceil(totalCount / 100);

        for (const item of items) {
          try {
            // DB에서 corpNm + brandNm으로 매칭
            const ftcId = `${item.corpNm}_${item.brandNm}`.replace(/\s+/g, "");

            const existing = await prismaClient.franchiseBrand.findUnique({
              where: { ftcId },
              select: {
                id: true,
                businessNumber: true,
                ftcDocId: true,
                franchiseFee: true,
              },
            });

            if (!existing) continue;

            // 기본 정보 업데이트 (사업자번호, 정보공개서 ID)
            const updateData: Record<string, any> = {};

            if (!existing.businessNumber || existing.businessNumber === "") {
              updateData.businessNumber = item.brno;
            }

            if (!existing.ftcDocId) {
              updateData.ftcDocId = item.jngIfrmpSn;
            }

            if (Object.keys(updateData).length > 0) {
              await prismaClient.franchiseBrand.update({
                where: { id: existing.id },
                data: updateData,
              });
              matched++;
            }
          } catch (err) {
            errors++;
          }
        }

        log(`[Disclosure] yr=${yr} page=${page}/${totalPages} (matched=${matched})`);
        page++;

        // Rate limiting
        if (page <= totalPages) {
          await sleep(delayMs);
        }
      } while (page <= totalPages);
    } catch (err) {
      log(`[Disclosure] yr=${yr} error: ${err}`);
      errors++;
    }
  }

  // 2단계: 비용 정보가 없는 브랜드에 대해 본문 파싱
  log(`[Disclosure] 본문 파싱 시작 (최대 ${maxContentFetch}건)`);

  const brandsNeedContent = await prismaClient.franchiseBrand.findMany({
    where: {
      ftcDocId: { not: null },
      franchiseFee: null,
      representativeName: null,
    },
    select: { id: true, ftcDocId: true, brandName: true },
    take: maxContentFetch,
  });

  for (const brand of brandsNeedContent) {
    try {
      const parsed = await getDisclosureContent(brand.ftcDocId!);
      if (!parsed) continue;

      const contentUpdate: Record<string, any> = {};
      if (parsed.representativeName) {
        contentUpdate.representativeName = parsed.representativeName;
      }
      // 정보공개서 값은 천원 단위 → DB는 만원 단위로 저장
      // 상한선 검증: 가맹비 1억(10000만), 교육비 5천만(5000만), 보증금 1억(10000만) 초과 시 파싱 오류로 판단
      if (parsed.franchiseFee !== undefined) {
        const val = Math.round(parsed.franchiseFee / 10);
        if (val <= 10000) contentUpdate.franchiseFee = val;
      }
      if (parsed.educationFee !== undefined) {
        const val = Math.round(parsed.educationFee / 10);
        if (val <= 5000) contentUpdate.educationFee = val;
      }
      if (parsed.depositFee !== undefined) {
        const val = Math.round(parsed.depositFee / 10);
        if (val <= 10000) contentUpdate.depositFee = val;
      }

      if (Object.keys(contentUpdate).length > 0) {
        await prismaClient.franchiseBrand.update({
          where: { id: brand.id },
          data: contentUpdate,
        });
        contentParsed++;
      }

      // Rate limiting (1초 간격 - 본문은 무거우므로)
      await sleep(1000);
    } catch (err) {
      log(`[Disclosure] Content parse error for ${brand.brandName}: ${err}`);
      errors++;
    }
  }

  log(`[Disclosure] 완료: matched=${matched}, contentParsed=${contentParsed}, errors=${errors}`);
  return { matched, contentParsed, errors };
}

function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
