import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { revokeInvite } from "@/lib/services/team";

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

    if (member.role !== "admin") {
      return NextResponse.json({ error: "Admin role required to revoke invites" }, { status: 403 });
    }

    const { id } = await context.params;
    const revoked = await revokeInvite({
      workspaceId: member.workspaceId,
      inviteId: id,
    });

    return NextResponse.json({ success: true, invite: revoked });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
