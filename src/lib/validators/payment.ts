import { z } from "zod/v4";

export const confirmPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(6).max(64),
  amount: z.number().int().positive(),
});

export const purchaseReportSchema = z.object({
  listingId: z.string().min(1),
});

export const createSubscriptionSchema = z.object({
  tier: z.enum(["PRO", "EXPERT"]),
});

export const createPaymentSchema = z.object({
  paymentType: z.enum(["PREMIUM_SUBSCRIPTION", "DEEP_REPORT", "FEATURED_LISTING", "ADVERTISEMENT"]),
  tier: z.string().optional(),
  listingId: z.string().optional(),
  reportPlanId: z.string().optional(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type PurchaseReportInput = z.infer<typeof purchaseReportSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
