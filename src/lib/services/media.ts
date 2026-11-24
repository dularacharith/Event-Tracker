import { db } from "@/db";
import { mediaFiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import {
  validateImageBuffer,
  storePrivateFile,
  retrievePrivateFile,
} from "@/lib/storage";

export async function uploadPrivateMedia({
  workspaceId,
  uploadedById,
  file,
  purpose,
}: {
  workspaceId: string;
  uploadedById: string;
  file: File;
  purpose: "avatar" | "evidence";
}) {
  const originalName = file.name || "upload";
  const mimeType = file.type || "application/octet-stream";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const validation = validateImageBuffer(buffer, mimeType);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file upload.");
  }

  const { storageKey } = await storePrivateFile(originalName, buffer, mimeType);

  const fileId = `file-${crypto.randomUUID()}`;

  const [record] = await db
    .insert(mediaFiles)
    .values({
      id: fileId,
      workspaceId,
      uploadedById,
      originalName,
      mimeType,
      sizeBytes: buffer.length,
      blobUrl: storageKey,
      purpose,
    })
    .returning();

  return record;
}

export async function getMediaFileRecord(fileId: string) {
  const [record] = await db
    .select()
    .from(mediaFiles)
    .where(eq(mediaFiles.id, fileId))
    .limit(1);

  return record || null;
}
