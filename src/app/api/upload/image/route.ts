import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/utils/constants";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    // Handle multipart form data (local upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const listingId = formData.get("listingId") as string | null;

      if (!file) {
        return Response.json({ error: { message: "파일이 없습니다." } }, { status: 400 });
      }

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return Response.json(
          { error: { message: "허용되지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)" } },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return Response.json(
          { error: { message: "파일 크기는 10MB 이하여야 합니다." } },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${uuidv4()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", listingId ?? "new");

      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const key = `uploads/${listingId ?? "new"}/${fileName}`;
      const url = `/${key}`;

      return Response.json({
        data: { key, url },
      });
    }

    // Handle JSON body (S3 presigned URL mode - production)
    const body = await req.json();
    const { listingId, contentType: fileContentType, fileName } = body;

    if (!ALLOWED_IMAGE_TYPES.includes(fileContentType)) {
      return Response.json(
        { error: { message: "허용되지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)" } },
        { status: 400 }
      );
    }

    // In development without S3, use local storage
    const ext = fileName?.split(".").pop() ?? "jpg";
    const key = `uploads/${listingId}/images/${uuidv4()}.${ext}`;

    // Check if S3 is configured
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const { getUploadPresignedUrl } = await import("@/lib/s3/presigned");
      const s3Key = `listings/${listingId}/images/${uuidv4()}.${ext}`;
      const presignedUrl = await getUploadPresignedUrl(s3Key, fileContentType);
      return Response.json({
        data: { presignedUrl, key: s3Key, maxSize: MAX_IMAGE_SIZE_BYTES },
      });
    }

    // Local fallback: return a local upload endpoint
    return Response.json({
      data: { key, url: `/${key}`, useLocalUpload: true },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
