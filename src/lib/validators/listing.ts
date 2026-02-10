import { z } from "zod/v4";

export const createListingSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상 입력해주세요.").max(100),
  description: z.string().min(10, "설명은 10자 이상 입력해주세요."),
  businessCategory: z.enum([
    "KOREAN_FOOD", "CHINESE_FOOD", "JAPANESE_FOOD", "WESTERN_FOOD",
    "CHICKEN", "PIZZA", "CAFE_BAKERY", "BAR_PUB", "BUNSIK",
    "DELIVERY", "OTHER_FOOD", "SERVICE", "RETAIL", "ENTERTAINMENT",
    "EDUCATION", "ACCOMMODATION", "OTHER",
  ]),
  storeType: z.enum([
    "GENERAL_STORE", "FRANCHISE", "FOOD_STREET", "OFFICE", "COMPLEX_MALL", "OTHER",
  ]),
  businessSubtype: z.string().optional(),
  price: z.number().int().nonnegative("보증금을 입력해주세요."),
  monthlyRent: z.number().int().nonnegative().optional(),
  premiumFee: z.number().int().nonnegative().optional(),
  managementFee: z.number().int().nonnegative().optional(),
  monthlyRevenue: z.number().int().nonnegative().optional(),
  monthlyProfit: z.number().int().nonnegative().optional(),
  operatingYears: z.number().int().nonnegative().optional(),
  address: z.string().min(1, "주소를 입력해주세요."),
  addressDetail: z.string().optional(),
  city: z.string().min(1, "시/도를 선택해주세요."),
  district: z.string().min(1, "구/군을 선택해주세요."),
  neighborhood: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  areaM2: z.number().positive().optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("올바른 이메일을 입력해주세요.").optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  query: z.string().optional(),
  businessCategory: z.string().optional(),
  storeType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  premiumFeeMin: z.coerce.number().int().nonnegative().optional(),
  premiumFeeMax: z.coerce.number().int().positive().optional(),
  rentMin: z.coerce.number().int().nonnegative().optional(),
  rentMax: z.coerce.number().int().positive().optional(),
  areaMin: z.coerce.number().nonnegative().optional(),
  areaMax: z.coerce.number().positive().optional(),
  sortBy: z.enum(["createdAt", "price", "viewCount", "favoriteCount", "monthlyRevenue", "monthlyProfit"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
