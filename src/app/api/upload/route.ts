import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { uploadPrivateMedia } from "@/lib/services/media";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to upload files." },
        { status: 401 }
      );
    }

    if (!member || member.status !== "active") {
      return NextResponse.json(
        { error: "Active workspace membership required." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as "avatar" | "evidence") || "evidence";

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided for upload." },
        { status: 400 }
      );
    }

    const record = await uploadPrivateMedia({
      workspaceId: member.workspaceId,
      uploadedById: user.id,
      file,
      purpose,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: record.id,
        originalName: record.originalName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        url: `/api/files/${record.id}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process upload." },
      { status: 400 }
    );
  }
}
