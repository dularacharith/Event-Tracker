import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { recordReviewVerdict } from "@/lib/services/activities";

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
    const { verdict, verdictReason } = body;

    if (verdict !== "passed" && verdict !== "failed") {
      return NextResponse.json(
        { error: "Verdict must be either 'passed' or 'failed'." },
        { status: 400 }
      );
    }

    if (!verdictReason || typeof verdictReason !== "string" || !verdictReason.trim()) {
      return NextResponse.json(
        { error: "A written reason is required when recording a review verdict." },
        { status: 400 }
      );
    }

    const updated = await recordReviewVerdict({
      workspaceId: member.workspaceId,
      activityId: id,
      reviewerId: user.id,
      verdict,
      verdictReason,
    });

    return NextResponse.json({ success: true, activity: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
