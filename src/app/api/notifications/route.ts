import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifs = await listUserNotifications({
      workspaceId: member.workspaceId,
      userId: user.id,
    });

    return NextResponse.json({ success: true, notifications: notifs });
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

    const { notificationId, markAll } = await req.json();

    if (markAll) {
      await markAllNotificationsRead({
        workspaceId: member.workspaceId,
        userId: user.id,
      });
    } else if (notificationId) {
      await markNotificationRead({
        workspaceId: member.workspaceId,
        userId: user.id,
        notificationId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
