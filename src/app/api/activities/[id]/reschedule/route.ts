import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { rescheduleActivity } from "@/lib/services/activities";

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
    const { scheduledAt, reviewDeadline, passCriteria, rescheduleReason } = body;

    if (!scheduledAt || !reviewDeadline) {
      return NextResponse.json(
        { error: "Both new scheduled time and review deadline are required." },
        { status: 400 }
      );
    }

    const updated = await rescheduleActivity({
      workspaceId: member.workspaceId,
      activityId: id,
      userId: user.id,
      userRole: member.role,
      scheduledAt: new Date(scheduledAt),
      reviewDeadline: new Date(reviewDeadline),
      passCriteria,
      rescheduleReason,
    });

    return NextResponse.json({ success: true, activity: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
