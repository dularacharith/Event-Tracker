import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { listWorkspaceMembers } from "@/lib/services/team";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await listWorkspaceMembers(member.workspaceId);
    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
