export function calculateSafetyGrade(input: {
  hasHometaxIntegration: boolean;
  hasCrefiaIntegration: boolean;
  hasRevenueDocuments: boolean;
}): { grade: "A" | "B" | "C"; comment: string } {
  if (input.hasHometaxIntegration || input.hasCrefiaIntegration) {
    return { grade: "A", comment: "매출 데이터 연동 인증 완료" };
  }
  if (input.hasRevenueDocuments) {
    return { grade: "B", comment: "매출 증빙자료 제출 완료" };
  }
  return { grade: "C", comment: "" };
}
