import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { createCampaign, listCampaigns } from "@/lib/services/campaigns";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await listCampaigns(member.workspaceId);
    return NextResponse.json({ success: true, campaigns });
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
      return NextResponse.json({ error: "Only admins can manage campaigns" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, color, startDate, endDate } = body;

    const campaign = await createCampaign({
      workspaceId: member.workspaceId,
      createdById: user.id,
      name,
      description,
      color,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
