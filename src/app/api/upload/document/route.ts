import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/utils/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    try {
      const limited = await checkRateLimit(`upload-document:${session.user.id}`, 10, 60);
      if (limited) return limited;
    } catch {}

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const listingId = (formData.get("listingId") as string) ?? "new";

    if (!file) {
      return Response.json({ error: { message: "파일을 선택해주세요." } }, { status: 400 });
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return Response.json(
        { error: { message: "허용되지 않는 파일 형식입니다. (PDF, JPG, PNG, WebP만 가능)" } },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return Response.json(
        { error: { message: "파일 크기는 10MB 이하여야 합니다." } },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "pdf";
    const fileName = `${uuidv4()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents", listingId);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const key = `uploads/documents/${listingId}/${fileName}`;
    const url = `/${key}`;

    return Response.json({
      data: {
        key,
        url,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
