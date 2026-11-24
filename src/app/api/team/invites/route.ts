import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { createInvite, listWorkspaceInvites } from "@/lib/services/team";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (member.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const invites = await listWorkspaceInvites(member.workspaceId);
    return NextResponse.json({ success: true, invites });
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

    if (member.role !== "admin") {
      return NextResponse.json({ error: "Admin role required to invite teammates" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role, expiresInDays } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const invite = await createInvite({
      workspaceId: member.workspaceId,
      invitedById: user.id,
      email,
      role: role === "admin" ? "admin" : "member",
      expiresInDays: Number(expiresInDays) || 7,
    });

    const origin = req.nextUrl.origin;
    const inviteLink = `${origin}/invite/${invite.token}`;

    return NextResponse.json({
      success: true,
      invite: {
        ...invite,
        inviteLink,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
