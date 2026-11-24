import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { getMediaFileRecord } from "@/lib/services/media";
import { retrievePrivateFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Enforce authentication and active workspace membership
    const { user, member } = await getCurrentAuth(req.headers);

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required to access private files." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!member || member.status !== "active") {
      return new NextResponse(
        JSON.stringify({ error: "Active workspace membership required to access private files." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch media record
    const fileRecord = await getMediaFileRecord(id);
    if (!fileRecord) {
      return new NextResponse(
        JSON.stringify({ error: "File not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Verify workspace boundary
    if (fileRecord.workspaceId !== member.workspaceId) {
      return new NextResponse(
        JSON.stringify({ error: "Access denied to file outside your workspace." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Retrieve private file contents
    const { buffer } = await retrievePrivateFile(fileRecord.blobUrl);

    // 5. Return private response
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": fileRecord.mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileRecord.originalName)}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
