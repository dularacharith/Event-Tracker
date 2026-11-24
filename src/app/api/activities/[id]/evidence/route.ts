import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { addEvidence, removeEvidence } from "@/lib/services/activities";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { type, mediaFileId, externalUrl, caption } = body;

    const evidence = await addEvidence({
      activityId: id,
      userId: user.id,
      type,
      mediaFileId,
      externalUrl,
      caption,
    });

    return NextResponse.json({ success: true, evidence });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = req.nextUrl;
    const evidenceId = searchParams.get("evidenceId");

    if (!evidenceId) {
      return NextResponse.json(
        { error: "evidenceId query parameter is required." },
        { status: 400 }
      );
    }

    await removeEvidence({
      activityId: id,
      evidenceId,
      userId: user.id,
      userRole: member.role,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
