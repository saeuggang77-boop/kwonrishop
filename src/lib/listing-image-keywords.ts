/**
 * 업종(소분류)별 loremflickr.com 키워드 매핑
 * seed.ts의 categories 배열 기준으로 모든 소분류 커버
 */
export const INDUSTRY_IMAGE_KEYWORDS: Record<string, string> = {
  // ── 외식업 ──
  "한식": "korean,restaurant",
  "중식": "chinese,restaurant",
  "일식/회": "sushi,restaurant",
  "양식": "italian,restaurant",
  "아시안": "asian,food",
  "분식": "street,food",
  "육류": "bbq,meat",
  "주류": "bar,pub",
  "버거류": "burger,restaurant",
  "커피": "coffee,cafe",
  "배달전문": "delivery,food",
  "유흥주점": "nightclub,bar",

  // ── 서비스업 ──
  "미용실": "hair,salon",
  "뷰티": "beauty,spa",
  "마사지": "massage,spa",
  "세탁소": "laundry,shop",
  "사우나": "sauna,bath",
  "카센터": "car,repair",
  "애견미용/호텔": "pet,grooming",

  // ── 도/소매업 ──
  "편의점": "convenience,store",
  "슈퍼마켓": "supermarket,grocery",
  "청과류": "fruit,market",
  "정육점": "butcher,shop",
  "의류가방": "clothing,store",
  "약국": "pharmacy,drugstore",
  "문구류": "stationery,shop",
  "액세서리": "accessories,jewelry",
  "화장품": "cosmetics,store",
  "리빙가구": "furniture,interior",
  "귀금속": "jewelry,gold",
  "가전제품": "electronics,store",
  "철물/자재": "hardware,tools",
  "꽃/식물": "flower,shop",
  "애견용품": "pet,shop",

  // ── 예술/스포츠/시설업 ──
  "노래방": "karaoke,room",
  "당구장": "billiards,pool",
  "독서실": "reading,study",
  "헬스클럽": "gym,fitness",
  "바둑기원": "board,game",
  "볼링장": "bowling,alley",
  "무도장": "martial,arts",
  "음악작업": "music,studio",
  "탁구장": "table,tennis",
  "실내골프": "golf,indoor",
  "실내야구": "baseball,batting",
  "풋살/축구": "soccer,futsal",
  "실내낚시": "fishing,indoor",
  "기타오락": "arcade,game",
  "무인사진": "photo,booth",
  "코인노래방": "karaoke,coin",
  "코인빨래방": "laundromat,coin",

  // ── 교육/학원업 ──
  "어린이집": "daycare,children",
  "학원": "academy,education",
  "키즈카페": "kids,cafe",
  "미술업": "art,studio",
  "공방": "craft,workshop",

  // ── 숙박업 ──
  "호텔모텔": "hotel,motel",
  "숙박업": "accommodation,lodging",
  "캠핑장": "camping,outdoor",
  "원룸텔": "guesthouse,room",

  // ── 기타 ──
  "기타업종": "storefront,shop",

  // fallback
  "default": "storefront,shop",
};

// ── 대분류 폴백 (소분류 없을 때) ──
const MAIN_CATEGORY_KEYWORDS: Record<string, string> = {
  "외식업": "restaurant,food",
  "서비스업": "salon,service",
  "도/소매업": "retail,store",
  "예술/스포츠/시설업": "leisure,venue",
  "교육/학원업": "classroom,education",
  "숙박업": "hotel,lobby",
  "기타": "storefront,shop",
};

// ── 상호명 키워드 폴백 (category/subCategory 둘 다 null일 때) ──
const STORE_NAME_KEYWORDS: Array<[RegExp, string]> = [
  [/카페|커피|cafe/i, "coffee,cafe"],
  [/세탁/, "laundry,shop"],
  [/편의점|cu|gs25|세븐일레븐/i, "convenience,store"],
  [/노래방|코인노래/, "karaoke"],
  [/삼겹|고기|숯불|갈비/, "bbq,korean"],
  [/헤어|미용|살롱/, "hair,salon"],
  [/네일|뷰티|왁싱/, "beauty,nail"],
  [/꽃집|플라워|florist/i, "flower,shop"],
  [/학원|스쿨|academy|school/i, "classroom,education"],
  [/피트니스|헬스|gym|fitness/i, "gym,fitness"],
  [/라멘|스시|회|초밥/, "japanese,restaurant"],
  [/분식|떡볶/, "street,food"],
  [/치킨|호프/, "fried,chicken"],
  [/빵|베이커리|bakery/i, "bakery,bread"],
  [/약국|pharmacy/i, "pharmacy"],
  [/마사지|massage/i, "massage,spa"],
];

function getKeywordFromStoreName(storeName?: string | null): string | null {
  if (!storeName) return null;
  for (const [pattern, keyword] of STORE_NAME_KEYWORDS) {
    if (pattern.test(storeName)) return keyword;
  }
  return null;
}

export function getImageKeyword(
  subCategoryName?: string | null,
  mainCategoryName?: string | null,
  storeName?: string | null,
): string {
  if (subCategoryName && INDUSTRY_IMAGE_KEYWORDS[subCategoryName]) {
    return INDUSTRY_IMAGE_KEYWORDS[subCategoryName];
  }
  if (mainCategoryName && MAIN_CATEGORY_KEYWORDS[mainCategoryName]) {
    return MAIN_CATEGORY_KEYWORDS[mainCategoryName];
  }
  const nameKeyword = getKeywordFromStoreName(storeName);
  if (nameKeyword) return nameKeyword;
  return INDUSTRY_IMAGE_KEYWORDS["default"];
}

/**
 * 업종과 seed 문자열로 loremflickr 이미지 URL 생성
 * lock 파라미터로 같은 seed에서 항상 동일한 이미지 반환
 */
export function buildListingImageUrl(
  subCategoryName: string | null | undefined,
  seed: string,
  imageType?: string,
  mainCategoryName?: string | null,
  storeName?: string | null,
): string {
  const keyword = getImageKeyword(subCategoryName, mainCategoryName, storeName);
  const typeKeyword =
    imageType === "INTERIOR"
      ? ",interior"
      : imageType === "KITCHEN"
      ? ",kitchen"
      : imageType === "EXTERIOR"
      ? ",exterior"
      : "";
  const lockParam = encodeURIComponent(seed);
  return `https://loremflickr.com/800/600/${keyword}${typeKeyword}?lock=${lockParam}`;
}
