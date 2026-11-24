import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { scheduleActivity } from "@/lib/services/activities";

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
    const { scheduledAt, reviewDeadline, ownerId, reviewerId, passCriteria } =
      body;

    const updated = await scheduleActivity({
      workspaceId: member.workspaceId,
      activityId: id,
      scheduledAt: new Date(scheduledAt),
      reviewDeadline: new Date(reviewDeadline),
      ownerId: ownerId || user.id,
      reviewerId,
      passCriteria,
      changedById: user.id,
    });

    return NextResponse.json({ success: true, activity: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
