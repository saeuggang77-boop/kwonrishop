import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { valuateListing } from "@/lib/insights/valuation";
import { errorToResponse } from "@/lib/utils/errors";
import { z } from "zod/v4";

const schema = z.object({ listingId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { listingId } = schema.parse(body);
    const result = await valuateListing(listingId);

    return Response.json({ data: result });
  } catch (error) {
    return errorToResponse(error);
  }
}
