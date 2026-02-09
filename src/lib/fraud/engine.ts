import { prisma } from "@/lib/prisma";
import { FraudSeverity, type FraudRuleType } from "@prisma/client";
import { checkDuplicatePhoto } from "./rules/duplicate-photo";
import { checkPriceSpike } from "./rules/price-spike";
import { checkMultiAccount } from "./rules/multi-account";

interface ViolationResult {
  ruleId: string;
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  details: Record<string, unknown>;
}

type RuleResult = Omit<ViolationResult, "ruleId"> | null;

type RuleChecker = (
  listingId: string,
  params: Record<string, unknown>
) => Promise<RuleResult>;

const ruleCheckers: Record<string, RuleChecker> = {
  DUPLICATE_PHOTO: checkDuplicatePhoto as RuleChecker,
  PRICE_SPIKE: checkPriceSpike as RuleChecker,
  MULTI_ACCOUNT_CONTACT: checkMultiAccount as RuleChecker,
};

/**
 * Run all active fraud rules against a listing
 */
export async function evaluateListing(
  listingId: string
): Promise<ViolationResult[]> {
  const rules = await prisma.fraudRule.findMany({
    where: { isActive: true },
  });

  const violations: ViolationResult[] = [];

  for (const rule of rules) {
    const checker = ruleCheckers[rule.ruleType];
    if (!checker) continue;

    try {
      const result = await checker(
        listingId,
        rule.parameters as Record<string, unknown>
      );
      if (result) {
        violations.push({
          ...result,
          ruleId: rule.id,
          severity: rule.severity,
        });
      }
    } catch (error) {
      console.error(
        `Fraud rule ${rule.ruleType} failed for listing ${listingId}:`,
        error
      );
    }
  }

  return violations;
}

/**
 * Process fraud violations: update listing status, create records, notify seller
 */
export async function processFraudViolations(
  listingId: string,
  violations: ViolationResult[]
) {
  if (violations.length === 0) return;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, title: true },
  });
  if (!listing) return;

  const user = await prisma.user.findUnique({
    where: { id: listing.sellerId },
    select: { violationCount: true },
  });
  if (!user) return;

  // Create violation records
  for (const violation of violations) {
    await prisma.fraudViolation.create({
      data: {
        listingId,
        userId: listing.sellerId,
        ruleId: violation.ruleId,
        severity: violation.severity,
        details: violation.details as object,
      },
    });
  }

  // Determine action
  const hasHighSeverity = violations.some(
    (v) =>
      v.severity === FraudSeverity.HIGH || v.severity === FraudSeverity.CRITICAL
  );
  const totalViolations = user.violationCount + violations.length;

  if (totalViolations >= 3) {
    // Repeated offender: auto-hide
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "HIDDEN" },
    });
  } else if (hasHighSeverity || totalViolations >= 2) {
    // High severity or 2+ violations: pending verification
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "PENDING_VERIFICATION" },
    });
  }

  // Update user violation count
  await prisma.user.update({
    where: { id: listing.sellerId },
    data: { violationCount: { increment: violations.length } },
  });

  // Create notification for seller
  await prisma.notification.create({
    data: {
      userId: listing.sellerId,
      title: "매물 검증 알림",
      message: `등록하신 매물 "${listing.title}"에 대해 검증이 필요합니다. ${violations.length}건의 의심 사항이 발견되었습니다.`,
      link: `/dashboard/listings`,
      sourceType: "fraud",
      sourceId: listingId,
    },
  });
}
