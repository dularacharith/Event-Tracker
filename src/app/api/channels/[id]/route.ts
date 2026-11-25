import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { deleteChannel, updateChannel } from "@/lib/services/channels";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteChannel(member.workspaceId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Channel not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, platform, description } = body;

    const updated = await updateChannel({
      workspaceId: member.workspaceId,
      channelId: id,
      name,
      platform,
      description,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
