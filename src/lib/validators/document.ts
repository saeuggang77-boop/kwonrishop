import { z } from "zod/v4";

export const uploadDocumentSchema = z.object({
  listingId: z.string().optional(),
  documentType: z.enum([
    "REGISTRY_COPY", "BUILDING_LEDGER", "LAND_LEDGER", "CADASTRAL_MAP",
    "CONTRACT", "ID_VERIFICATION", "BUSINESS_LICENSE", "OTHER",
  ]),
  accessLevel: z.enum(["PUBLIC", "BUYER_ONLY", "ADMIN_ONLY", "OWNER_ONLY"]).optional().default("OWNER_ONLY"),
  ttlDays: z.number().int().min(1).max(365).optional(),
  consentGiven: z.boolean().refine((v) => v === true, "개인정보 수집 및 이용에 동의해주세요."),
  hasClientMask: z.boolean().optional().default(false),
  maskRegions: z.array(z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
