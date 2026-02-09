import { z } from "zod/v4";

export const createListingSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상 입력해주세요.").max(100),
  description: z.string().min(10, "설명은 10자 이상 입력해주세요."),
  rightsCategory: z.enum([
    "JEONSE", "WOLSE", "MORTGAGE", "OWNERSHIP", "SUPERFICIES",
    "EASEMENT", "LIEN", "PROVISIONAL_REG", "LEASE_RIGHT", "AUCTION", "OTHER",
  ]),
  propertyType: z.enum([
    "APARTMENT", "VILLA", "OFFICETEL", "DETACHED_HOUSE",
    "COMMERCIAL", "OFFICE", "LAND", "FACTORY", "OTHER",
  ]),
  price: z.number().int().positive("가격을 입력해주세요."),
  monthlyRent: z.number().int().nonnegative().optional(),
  maintenanceFee: z.number().int().nonnegative().optional(),
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
  buildYear: z.number().int().min(1900).max(2030).optional(),
  roomCount: z.number().int().nonnegative().optional(),
  bathroomCount: z.number().int().nonnegative().optional(),
  registryNumber: z.string().optional(),
  rightsPriority: z.number().int().positive().optional(),
  expirationDate: z.string().datetime().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("올바른 이메일을 입력해주세요.").optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  query: z.string().optional(),
  rightsCategory: z.string().optional(),
  propertyType: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  areaMin: z.coerce.number().nonnegative().optional(),
  areaMax: z.coerce.number().positive().optional(),
  sortBy: z.enum(["createdAt", "price", "viewCount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
