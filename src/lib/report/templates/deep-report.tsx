import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "NotoSansKR",
  src: "https://cdn.jsdelivr.net/gh/nicothin/NotoSansKR/NotoSansKR-Regular.otf",
});

Font.register({
  family: "NotoSansKR-Bold",
  src: "https://cdn.jsdelivr.net/gh/nicothin/NotoSansKR/NotoSansKR-Bold.otf",
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottom: "2px solid #2EC4B6",
    paddingBottom: 15,
  },
  brandName: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 20,
    color: "#0B3B57",
  },
  date: {
    fontSize: 9,
    color: "#6B7280",
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 16,
    color: "#0B3B57",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 12,
    color: "#0B3B57",
    marginTop: 20,
    marginBottom: 10,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontSize: 9,
    color: "#6B7280",
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  priceBox: {
    backgroundColor: "#F0FDFA",
    borderRadius: 6,
    padding: 15,
    marginVertical: 10,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  priceValue: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 22,
    color: "#0B3B57",
    marginTop: 4,
  },
  table: {
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottom: "1px solid #E5E7EB",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #F3F4F6",
    padding: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: "NotoSansKR-Bold",
  },
  disclaimer: {
    marginTop: 30,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 15,
  },
  disclaimerText: {
    fontSize: 7,
    color: "#9CA3AF",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9CA3AF",
    borderTop: "1px solid #E5E7EB",
    paddingTop: 10,
  },
});

export interface ReportData {
  listing: {
    title: string;
    price: string;
    address: string;
    businessCategory: string;
    storeType: string;
    areaM2: number | null;
    premiumFee: string | null;
    monthlyRevenue: string | null;
    monthlyProfit: string | null;
    managementFee: string | null;
    businessSubtype: string | null;
    operatingYears: number | null;
    description: string;
  };
  comparisons: {
    radiusKm: number;
    comparableCount: number;
    avgPremiumFee?: string;
    medianPrice?: string;
    minPrice?: string;
    maxPrice?: string;
    pricePercentile: number | null;
  }[];
  valuation: {
    estimatedValue?: number;
    confidenceInterval?: { low: number; high: number };
    comparableCount?: number;
  } | null;
  meta: {
    dataSources: string[];
    modelAssumptions: string[];
    modelVersion: string;
    generatedAt: string;
    legalDisclaimer: string;
  };
}

function formatPrice(value: string | number | undefined): string {
  if (!value) return "-";
  const num = typeof value === "string" ? parseInt(value) : value;
  if (num >= 100_000_000) {
    const eok = Math.floor(num / 100_000_000);
    const remainder = num % 100_000_000;
    if (remainder === 0) return `${eok}억원`;
    return `${eok}억 ${Math.round(remainder / 10_000).toLocaleString()}만원`;
  }
  if (num >= 10_000) {
    return `${Math.round(num / 10_000).toLocaleString()}만원`;
  }
  return `${num.toLocaleString()}원`;
}

const CATEGORY_LABELS: Record<string, string> = {
  KOREAN_FOOD: "한식",
  CHINESE_FOOD: "중식",
  JAPANESE_FOOD: "일식/회",
  WESTERN_FOOD: "양식",
  CHICKEN: "치킨",
  PIZZA: "피자",
  CAFE_BAKERY: "카페/베이커리",
  BAR_PUB: "주류/호프",
  BUNSIK: "분식",
  DELIVERY: "배달전문",
  OTHER_FOOD: "기타 외식",
  SERVICE: "서비스업",
  RETAIL: "도소매업",
  ENTERTAINMENT: "오락/스포츠",
  EDUCATION: "교육/학원",
  ACCOMMODATION: "숙박업",
  OTHER: "기타",
};

const STORE_LABELS: Record<string, string> = {
  GENERAL_STORE: "일반상가",
  FRANCHISE: "프랜차이즈",
  FOOD_STREET: "먹자골목",
  OFFICE: "사무실",
  COMPLEX_MALL: "복합상가",
  OTHER: "기타",
};

export function DeepReportDocument({ data }: { data: ReportData }) {
  const { listing, comparisons, valuation, meta } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>권리샵</Text>
          <Text style={styles.date}>생성일: {meta.generatedAt.split("T")[0]}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>상가 분석 심층 리포트</Text>
        <Text style={{ fontSize: 12, color: "#374151", marginBottom: 15 }}>
          {listing.title}
        </Text>

        {/* Price */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>매물 가격</Text>
          <Text style={styles.priceValue}>{formatPrice(listing.price)}</Text>
        </View>

        {/* Property Info */}
        <Text style={styles.sectionTitle}>매물 정보</Text>
        <View style={styles.row}>
          <Text style={styles.label}>주소</Text>
          <Text style={styles.value}>{listing.address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>업종</Text>
          <Text style={styles.value}>{CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>상가유형</Text>
          <Text style={styles.value}>{STORE_LABELS[listing.storeType] ?? listing.storeType}</Text>
        </View>
        {listing.businessSubtype && (
          <View style={styles.row}>
            <Text style={styles.label}>세부업종</Text>
            <Text style={styles.value}>{listing.businessSubtype}</Text>
          </View>
        )}
        {listing.areaM2 && (
          <View style={styles.row}>
            <Text style={styles.label}>면적</Text>
            <Text style={styles.value}>{listing.areaM2}m²</Text>
          </View>
        )}
        {listing.premiumFee && (
          <View style={styles.row}>
            <Text style={styles.label}>권리금</Text>
            <Text style={styles.value}>{formatPrice(listing.premiumFee)}</Text>
          </View>
        )}
        {listing.monthlyRevenue && (
          <View style={styles.row}>
            <Text style={styles.label}>월매출</Text>
            <Text style={styles.value}>{formatPrice(listing.monthlyRevenue)}</Text>
          </View>
        )}
        {listing.monthlyProfit && (
          <View style={styles.row}>
            <Text style={styles.label}>월수익</Text>
            <Text style={styles.value}>{formatPrice(listing.monthlyProfit)}</Text>
          </View>
        )}
        {listing.managementFee && (
          <View style={styles.row}>
            <Text style={styles.label}>관리비</Text>
            <Text style={styles.value}>{formatPrice(listing.managementFee)}</Text>
          </View>
        )}
        {listing.operatingYears !== null && listing.operatingYears !== undefined && (
          <View style={styles.row}>
            <Text style={styles.label}>운영기간</Text>
            <Text style={styles.value}>{listing.operatingYears}년</Text>
          </View>
        )}

        {/* Valuation */}
        {valuation?.estimatedValue && (
          <>
            <Text style={styles.sectionTitle}>시장가치 평가</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>추정 시장가치</Text>
              <Text style={styles.priceValue}>{formatPrice(valuation.estimatedValue)}</Text>
            </View>
            {valuation.confidenceInterval && (
              <View style={styles.row}>
                <Text style={styles.label}>신뢰구간</Text>
                <Text style={styles.value}>
                  {formatPrice(valuation.confidenceInterval.low)} ~ {formatPrice(valuation.confidenceInterval.high)}
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>비교 매물 수</Text>
              <Text style={styles.value}>{valuation.comparableCount ?? 0}건</Text>
            </View>
          </>
        )}

        {/* Comparison */}
        {comparisons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>주변 시세 비교</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellBold}>반경</Text>
                <Text style={styles.tableCellBold}>비교 건수</Text>
                <Text style={styles.tableCellBold}>평균가</Text>
                <Text style={styles.tableCellBold}>중간가</Text>
                <Text style={styles.tableCellBold}>백분위</Text>
              </View>
              {comparisons.map((c, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{c.radiusKm}km</Text>
                  <Text style={styles.tableCell}>{c.comparableCount}건</Text>
                  <Text style={styles.tableCell}>{formatPrice(c.avgPremiumFee)}</Text>
                  <Text style={styles.tableCell}>{formatPrice(c.medianPrice)}</Text>
                  <Text style={styles.tableCell}>
                    {c.pricePercentile !== null ? `상위 ${(100 - c.pricePercentile).toFixed(0)}%` : "-"}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Data Sources */}
        <Text style={styles.sectionTitle}>데이터 출처</Text>
        {meta.dataSources.map((src, i) => (
          <Text key={i} style={{ fontSize: 9, color: "#4B5563", marginBottom: 2 }}>
            • {src}
          </Text>
        ))}

        {/* Model Assumptions */}
        <Text style={styles.sectionTitle}>분석 가정</Text>
        {meta.modelAssumptions.map((a, i) => (
          <Text key={i} style={{ fontSize: 9, color: "#4B5563", marginBottom: 2 }}>
            • {a}
          </Text>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontFamily: "NotoSansKR-Bold", fontSize: 8, color: "#6B7280", marginBottom: 5 }}>
            면책조항
          </Text>
          <Text style={styles.disclaimerText}>{meta.legalDisclaimer}</Text>
          <Text style={{ ...styles.disclaimerText, marginTop: 5 }}>
            모델 버전: {meta.modelVersion}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 권리샵 (kwonrishop.com) — 본 보고서는 참고용이며 법적 효력이 없습니다.
        </Text>
      </Page>
    </Document>
  );
}
