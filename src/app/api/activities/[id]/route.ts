import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { getActivityDetails } from "@/lib/services/activities";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const details = await getActivityDetails(member.workspaceId, id);

    if (!details) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, activity: details });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
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

    const [existing] = await db
      .select()
      .from(activities)
      .where(
        and(eq(activities.id, id), eq(activities.workspaceId, member.workspaceId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    // Only owner, creator, or admin can update
    if (
      existing.ownerId !== user.id &&
      existing.createdById !== user.id &&
      member.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: Partial<typeof activities.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.brief !== undefined) updates.brief = body.brief.trim();
    if (body.socialPlatform !== undefined) updates.socialPlatform = body.socialPlatform;
    if (body.contentType !== undefined) updates.contentType = body.contentType;
    if (body.passCriteria !== undefined) updates.passCriteria = body.passCriteria.trim();

    // Only admin can reassign owner if not in draft
    if (body.ownerId !== undefined) {
      if (member.role === "admin" || existing.status === "draft") {
        updates.ownerId = body.ownerId;
      }
    }

    const [updated] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();

    return NextResponse.json({ success: true, activity: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const [existing] = await db
      .select()
      .from(activities)
      .where(
        and(eq(activities.id, id), eq(activities.workspaceId, member.workspaceId))
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (
      existing.ownerId !== user.id &&
      existing.createdById !== user.id &&
      member.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(activities).where(eq(activities.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

