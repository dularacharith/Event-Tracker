import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import {
  createActivity,
  listActivities,
  ActivityStatus,
  SocialPlatform,
} from "@/lib/services/activities";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const campaignId = searchParams.get("campaignId") || undefined;
    const channelId = searchParams.get("channelId") || undefined;
    const status = (searchParams.get("status") as ActivityStatus) || undefined;
    const socialPlatform =
      (searchParams.get("socialPlatform") as SocialPlatform) || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const reviewerId = searchParams.get("reviewerId") || undefined;

    const items = await listActivities({
      workspaceId: member.workspaceId,
      campaignId,
      channelId,
      status,
      socialPlatform,
      ownerId,
      reviewerId,
    });

    return NextResponse.json({ success: true, activities: items });
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
    const {
      campaignId,
      channelId,
      title,
      brief,
      socialPlatform,
      contentType,
      scheduledAt,
      reviewDeadline,
      recurrenceRule,
      recurrenceDay,
      recurrenceEndDate,
      recurrenceCount,
      ownerId,
      reviewerId,
      passCriteria,
      initialStatus,
    } = body;

    // For a Member, if ownerId is not specified, default to themselves.
    // If a Member specifies ownerId different from themselves and is not admin,
    // Admin manages activity assignments, Member creates their own activities.
    const resolvedOwnerId =
      member.role === "admin"
        ? ownerId || user.id
        : user.id;

    const activity = await createActivity({
      workspaceId: member.workspaceId,
      campaignId,
      channelId: channelId || null,
      title,
      brief,
      socialPlatform,
      contentType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
      recurrenceRule: recurrenceRule || null,
      recurrenceDay: recurrenceDay || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      recurrenceCount: recurrenceCount ? Number(recurrenceCount) : 5,
      ownerId: resolvedOwnerId,
      reviewerId: reviewerId || null,
      passCriteria: passCriteria || "",
      createdById: user.id,
      initialStatus: initialStatus || "draft",
    });

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
