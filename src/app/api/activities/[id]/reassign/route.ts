import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { reassignReviewer } from "@/lib/services/activities";

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
      return NextResponse.json(
        { error: "Only admins can reassign reviewers." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { newReviewerId } = body;

    if (!newReviewerId) {
      return NextResponse.json(
        { error: "New reviewer ID is required." },
        { status: 400 }
      );
    }

    const updated = await reassignReviewer({
      workspaceId: member.workspaceId,
      activityId: id,
      adminId: user.id,
      newReviewerId,
    });

    return NextResponse.json({ success: true, activity: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
