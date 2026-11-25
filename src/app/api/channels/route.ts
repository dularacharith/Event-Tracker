import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { createChannel, listChannels } from "@/lib/services/channels";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await listChannels(member.workspaceId);
    return NextResponse.json({ success: true, channels });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, platform, description } = body;

    const channel = await createChannel({
      workspaceId: member.workspaceId,
      name,
      platform,
      description,
    });

    return NextResponse.json({ success: true, channel });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
