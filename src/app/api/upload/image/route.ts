import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadPresignedUrl } from "@/lib/s3/presigned";
import { errorToResponse } from "@/lib/utils/errors";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/utils/constants";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { listingId, contentType, fileName } = body;

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return Response.json(
        { error: { message: "허용되지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)" } },
        { status: 400 }
      );
    }

    const ext = fileName?.split(".").pop() ?? "jpg";
    const key = `listings/${listingId}/images/${uuidv4()}.${ext}`;

    const presignedUrl = await getUploadPresignedUrl(key, contentType);

    return Response.json({
      data: {
        presignedUrl,
        key,
        maxSize: MAX_IMAGE_SIZE_BYTES,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
