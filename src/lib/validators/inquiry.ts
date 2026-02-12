import { z } from "zod/v4";

export const createInquirySchema = z.object({
  listingId: z.string().min(1, "매물 ID가 필요합니다."),
  message: z.string().min(10, "문의 내용은 10자 이상 입력해주세요.").max(1000, "문의 내용은 1000자 이하로 입력해주세요."),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "REPLIED", "CANCELLED"]),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;
