import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

export const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function validateImageBuffer(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds the 3 MB limit. For larger files, please provide an external link.",
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: "Only PNG, JPEG, and WebP images are supported. For videos or other formats, please use an external link.",
    };
  }

  // Magic bytes validation
  if (mimeType === "image/png") {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      return { valid: false, error: "Invalid PNG file format." };
    }
  } else if (mimeType === "image/jpeg") {
    // JPEG magic bytes: FF D8 FF
    if (
      buffer.length < 3 ||
      buffer[0] !== 0xff ||
      buffer[1] !== 0xd8 ||
      buffer[2] !== 0xff
    ) {
      return { valid: false, error: "Invalid JPEG file format." };
    }
  } else if (mimeType === "image/webp") {
    // WebP magic bytes: RIFF....WEBP
    if (
      buffer.length < 12 ||
      buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WEBP"
    ) {
      return { valid: false, error: "Invalid WebP file format." };
    }
  }

  return { valid: true };
}

export async function storePrivateFile(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ storageKey: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    // Vercel Blob private storage
    const blob = await put(`campaignflow/${Date.now()}-${filename}`, buffer, {
      access: "private" as any,
      contentType: mimeType,
      token,
    });
    return { storageKey: blob.url };
  } else {
    // Local / fallback filesystem storage for local development and tests
    const uploadDir = path.resolve(process.cwd(), ".uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buffer);
    return { storageKey: `local://${safeName}` };
  }
}

export async function retrievePrivateFile(
  storageKey: string
): Promise<{ buffer: Buffer; contentType?: string }> {
  if (storageKey.startsWith("local://")) {
    const filename = storageKey.replace("local://", "");
    const filePath = path.resolve(process.cwd(), ".uploads", filename);
    const buffer = await fs.readFile(filePath);
    return { buffer };
  } else if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    // Fetch from private Vercel Blob using token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const res = await fetch(storageKey, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Failed to retrieve file from blob storage: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: res.headers.get("content-type") || undefined,
    };
  } else {
    throw new Error(`Unsupported storage key scheme: ${storageKey}`);
  }
}
