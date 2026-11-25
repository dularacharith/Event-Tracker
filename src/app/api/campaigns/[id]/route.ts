import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { updateCampaign, deleteCampaign, getCampaignById } from "@/lib/services/campaigns";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can edit campaigns" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, status, color, startDate, endDate } = body;

    const campaign = await updateCampaign({
      workspaceId: member.workspaceId,
      campaignId: id,
      name,
      description,
      status,
      color,
      startDate: startDate ? new Date(startDate) : startDate === null ? null : undefined,
      endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete campaigns" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteCampaign(member.workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
