import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { uploadDocumentSchema } from "@/lib/validators/document";
import { encryptDocument } from "@/lib/kms/encrypt";
import { uploadToS3 } from "@/lib/s3/upload";
import { errorToResponse } from "@/lib/utils/errors";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/utils/constants";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const metadata = JSON.parse(formData.get("metadata") as string);

    if (!file) {
      return Response.json({ error: { message: "파일을 선택해주세요." } }, { status: 400 });
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return Response.json({ error: { message: "허용되지 않는 파일 형식입니다." } }, { status: 400 });
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return Response.json({ error: { message: "파일 크기가 50MB를 초과합니다." } }, { status: 400 });
    }

    const parsed = uploadDocumentSchema.parse(metadata);

    const buffer = Buffer.from(await file.arrayBuffer());

    // Encrypt with KMS
    const { encrypted, encryptedDataKey, iv } = await encryptDocument(buffer);

    // Upload encrypted file to S3
    const s3Key = `documents/${session.user.id}/${uuidv4()}/${file.name}`;
    await uploadToS3(s3Key, encrypted, "application/octet-stream");

    // Calculate expiry
    const expiresAt = parsed.ttlDays
      ? new Date(Date.now() + parsed.ttlDays * 86_400_000)
      : null;

    // Create document record
    const document = await prisma.document.create({
      data: {
        uploaderId: session.user.id,
        listingId: parsed.listingId,
        documentType: parsed.documentType,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        s3Key,
        kmsKeyId: encryptedDataKey,
        encryptionIv: iv,
        accessLevel: parsed.accessLevel,
        expiresAt,
        consentGiven: parsed.consentGiven,
        consentGivenAt: new Date(),
        hasClientMask: parsed.hasClientMask,
        maskRegions: parsed.maskRegions,
      },
    });

    return Response.json({
      data: {
        id: document.id,
        fileName: document.fileName,
        documentType: document.documentType,
        expiresAt: document.expiresAt?.toISOString() ?? null,
        consentGiven: document.consentGiven,
      },
    }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
