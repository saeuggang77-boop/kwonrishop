/**
 * 공정거래위원회 정보공개서 API 클라이언트
 * API Base: https://franchise.ftc.go.kr/api/search.do
 * - type=list: 정보공개서 목록 (XML)
 * - type=content: 정보공개서 본문 (HTML)
 *
 * Referer 헤더 필수: https://franchise.ftc.go.kr/
 */

const FTC_DISCLOSURE_BASE = "https://franchise.ftc.go.kr/api/search.do";
function getFtcKey() {
  return process.env.FTC_DISCLOSURE_API_KEY || "";
}

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
  headquarterAddress?: string;  // 본사 주소
  establishedDate?: string;     // 설립일
  franchiseStartDate?: string;  // 가맹사업 시작일
  contractPeriod?: string;      // 가맹계약 기간
  interiorCost?: string;        // 인테리어 비용
  adPromotionFee?: string;      // 광고판촉분담금
  territoryProtection?: boolean; // 영업지역 보호 여부
  companyOwnedStores?: number;  // 직영점수
  financialSummary?: {          // 재무요약
    year?: string;
    totalAssets?: string;
    revenue?: string;
    operatingProfit?: string;
    netProfit?: string;
  };
  regionalStores?: Record<string, number>; // 지역별 가맹점수
}

/**
 * 정보공개서 목록 조회 (XML)
 */
export async function listDisclosures(
  yr: string,
  page: number = 1,
  pageSize: number = 100
): Promise<{ items: DisclosureListItem[]; totalCount: number }> {
  if (!getFtcKey()) {
    console.error("[FTC Disclosure] API key not configured");
    return { items: [], totalCount: 0 };
  }

  try {
    const url = `${FTC_DISCLOSURE_BASE}?type=list&yr=${yr}&serviceKey=${encodeURIComponent(getFtcKey())}&pageNo=${page}&numOfRows=${pageSize}&viewType=xml`;

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
  if (!getFtcKey()) {
    return null;
  }

  try {
    const url = `${FTC_DISCLOSURE_BASE}?type=content&jngIfrmpSn=${jngIfrmpSn}&serviceKey=${encodeURIComponent(getFtcKey())}`;

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

          // 설립일 (사업자등록일 또는 법인설립등기일)
          const estColIdx = headerLabels.findIndex((l) =>
            l.replace(/\s/g, "").includes("사업자등록일")
          );
          if (estColIdx >= 0 && values[estColIdx]) {
            const estDate = values[estColIdx].replace(/\u00a0/g, ' ').trim();
            if (estDate && estDate !== '-' && estDate !== '없음' && estDate !== '개인사업자') {
              result.establishedDate = stripControlChars(estDate);
            }
          }
          // 법인설립등기일도 확인 (개인사업자가 아닌 경우)
          if (!result.establishedDate) {
            const corpEstColIdx = headerLabels.findIndex((l) =>
              l.replace(/\s/g, "").includes("법인설립등기일")
            );
            if (corpEstColIdx >= 0 && values[corpEstColIdx]) {
              const estDate = values[corpEstColIdx].replace(/\u00a0/g, ' ').trim();
              if (estDate && estDate !== '-' && estDate !== '없음' && estDate !== '개인사업자') {
                result.establishedDate = stripControlChars(estDate);
              }
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

    // 5. 설립일 (대표자 파싱 블록 내부에서 이미 추출했으므로 별도 로직 불필요)
    // 이미 위 대표자 블록에서 처리됨

    // 6. 본사 주소
    const addrIdx = html.indexOf('소재지</span>');
    if (addrIdx >= 0) {
      const trStart = html.lastIndexOf('<tr', addrIdx);
      const trEnd = html.indexOf('</tr>', addrIdx);
      if (trStart >= 0 && trEnd >= 0) {
        const nextTrStart = html.indexOf('<tr', trEnd);
        const nextTrEnd = html.indexOf('</tr>', nextTrStart + 1);
        if (nextTrStart >= 0 && nextTrEnd >= 0) {
          const valueRow = html.substring(nextTrStart, nextTrEnd);
          const values = extractSpanTexts(valueRow);
          const addrParts: string[] = [];
          for (const v of values) {
            const cleaned = v.replace(/\u00a0/g, ' ').trim();
            if (/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/.test(cleaned)) {
              addrParts.push(cleaned);
            } else if (addrParts.length > 0 && !cleaned.match(/^\d{4}\.\s/)) {
              addrParts.push(cleaned);
            }
          }
          if (addrParts.length > 0) {
            result.headquarterAddress = stripControlChars(addrParts.join(' '));
          }
        }
      }
    }

    // 7. 가맹사업 시작일
    const startMatch = html.match(/시작한\s*날\s*[:\uff1a]\s*(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/);
    if (startMatch) {
      result.franchiseStartDate = stripControlChars(startMatch[1].replace(/\u00a0/g, ' '));
    }

    // 8. 가맹계약 기간
    const ctrtIdx = html.indexOf('JNG_CTRT_UPDT_PD');
    if (ctrtIdx >= 0) {
      const ctrtChunk = html.substring(ctrtIdx, ctrtIdx + 3000);
      // span 텍스트만 추출하여 합친 후 매칭 (HTML 태그가 span 사이에 있으므로)
      const ctrtSpans = extractSpanTexts(ctrtChunk);
      const ctrtText = ctrtSpans.join(' ').replace(/\u00a0/g, ' ');
      const ctrtMatch = ctrtText.match(/계약기간은\s*계약체결일로부터\s*\[?(\d+)\]?\s*년/);
      if (ctrtMatch) {
        result.contractPeriod = `${ctrtMatch[1]}년`;
      }
    }

    // 9. 인테리어 비용
    const intIdx = html.indexOf('>인테리어</span>');
    if (intIdx >= 0) {
      const trStart = html.lastIndexOf('<tr', intIdx);
      const trEnd = html.indexOf('</tr>', intIdx);
      if (trStart >= 0 && trEnd >= 0) {
        const row = html.substring(trStart, trEnd);
        const spans = extractSpanTexts(row);
        for (const s of spans) {
          const cleaned = s.replace(/[\s\u00a0]/g, '').replace(/,/g, '');
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num >= 100) {
            const manwon = Math.round(num / 10);
            result.interiorCost = `${manwon.toLocaleString()}만원`;
            break;
          }
        }
      }
    }

    // 10. 광고판촉분담금
    const adLabels = ['광고∙판촉분담금', '광고ㆍ판촉분담금', '광고판촉분담금', '광고분담금'];
    const adFee = extractFeeFromRow(html, adLabels);
    if (adFee !== undefined) {
      const manwon = Math.round(adFee / 10);
      result.adPromotionFee = `${manwon.toLocaleString()}만원`;
    }

    // 11. 영업지역 보호
    if (html.includes('영업지역을 설정') || html.includes('영업지역을\u00a0설정')) {
      const noProtect = /영업지역을[\s\u00a0]*설정하[고지][\s\u00a0]*있지[\s\u00a0]*않/.test(html);
      result.territoryProtection = !noProtect;
    }

    // 12. 직영점수
    const ownedIdx = html.indexOf('>직영점수</span>');
    if (ownedIdx >= 0) {
      const trEnd = html.indexOf('</tr>', ownedIdx);
      const nextTrStart = html.indexOf('<tr', trEnd);
      const nextTrEnd = html.indexOf('</tr>', nextTrStart + 1);
      if (nextTrStart >= 0 && nextTrEnd >= 0) {
        const valueRow = html.substring(nextTrStart, nextTrEnd);
        const values = extractSpanTexts(valueRow);
        if (values.length >= 4 && values[0] === '전체') {
          const lastVal = values[values.length - 1].replace(/[\s\u00a0,]/g, '');
          const num = parseInt(lastVal, 10);
          if (!isNaN(num)) {
            result.companyOwnedStores = num;
          }
        }
      }
    }

    // 13. 재무요약
    const revenueIdx = html.indexOf('>매출액</span>');
    if (revenueIdx >= 0) {
      const trEnd = html.indexOf('</tr>', revenueIdx);
      const nextTrStart = html.indexOf('<tr', trEnd);
      const nextTrEnd = html.indexOf('</tr>', nextTrStart + 1);
      if (nextTrStart >= 0 && nextTrEnd >= 0) {
        const valueRow = html.substring(nextTrStart, nextTrEnd);
        const values = extractSpanTexts(valueRow);
        if (values.length >= 7) {
          const cleanVal = (v: string) => {
            const c = v.replace(/[\s\u00a0,]/g, '');
            return c === '-' || c === '' ? undefined : c;
          };
          const summary: any = { year: cleanVal(values[0]) };
          if (cleanVal(values[1])) summary.totalAssets = cleanVal(values[1]);
          if (cleanVal(values[4])) summary.revenue = cleanVal(values[4]);
          if (cleanVal(values[5])) summary.operatingProfit = cleanVal(values[5]);
          if (cleanVal(values[6])) summary.netProfit = cleanVal(values[6]);
          if (summary.year || summary.revenue || summary.totalAssets) {
            result.financialSummary = summary;
          }
        }
      }
    }

    // 14. 지역별 가맹점 분포
    const seoulIdx = html.indexOf('>서울</span>');
    if (seoulIdx >= 0) {
      const regional: Record<string, number> = {};
      let pos = html.lastIndexOf('<tr', seoulIdx);
      const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

      for (let i = 0; i < 17; i++) {
        const trEnd = html.indexOf('</tr>', pos);
        if (trEnd < 0) break;
        const row = html.substring(pos, trEnd);
        const spans = extractSpanTexts(row);
        if (spans.length >= 2 && REGIONS.includes(spans[0])) {
          const latestTotal = spans.length >= 10 ? spans[7] : spans[1];
          const num = parseInt(latestTotal.replace(/[\s\u00a0,]/g, ''), 10);
          if (!isNaN(num)) {
            regional[spans[0]] = num;
          }
        }
        pos = html.indexOf('<tr', trEnd);
        if (pos < 0) break;
      }

      if (Object.keys(regional).length > 0) {
        result.regionalStores = regional;
      }
    }
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
      if (parsed.representativePhone) {
        contentUpdate.representativePhone = parsed.representativePhone;
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
      if (parsed.headquarterAddress) contentUpdate.headquarterAddress = parsed.headquarterAddress;
      if (parsed.establishedDate) contentUpdate.establishedDate = parsed.establishedDate;
      if (parsed.franchiseStartDate) contentUpdate.franchiseStartDate = parsed.franchiseStartDate;
      if (parsed.contractPeriod) contentUpdate.contractPeriod = parsed.contractPeriod;
      if (parsed.interiorCost) contentUpdate.interiorCost = parsed.interiorCost;
      if (parsed.adPromotionFee) contentUpdate.adPromotionFee = parsed.adPromotionFee;
      if (parsed.territoryProtection !== undefined) contentUpdate.territoryProtection = parsed.territoryProtection;
      if (parsed.companyOwnedStores !== undefined) contentUpdate.companyOwnedStores = parsed.companyOwnedStores;
      if (parsed.financialSummary) contentUpdate.financialSummary = parsed.financialSummary;
      if (parsed.regionalStores) contentUpdate.regionalStores = parsed.regionalStores;

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
