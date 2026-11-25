import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { transitionActivityStatus } from "@/lib/services/activities";

export const runtime = "nodejs";

const VALID_STATUSES = [
  "draft",
  "scheduled",
  "in_progress",
  "awaiting_review",
  "passed",
  "failed",
  "canceled",
] as const;

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

    if (!body.targetStatus || !VALID_STATUSES.includes(body.targetStatus)) {
      return NextResponse.json(
        { error: `Invalid target status: ${body.targetStatus}` },
        { status: 400 }
      );
    }

    const result = await transitionActivityStatus({
      workspaceId: member.workspaceId,
      activityId: id,
      targetStatus: body.targetStatus,
      userId: user.id,
      reason: body.reason,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
