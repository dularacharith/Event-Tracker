import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function listUserNotifications({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  const notifs = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientId, userId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return notifs;
}

export async function markNotificationRead({
  workspaceId,
  userId,
  notificationId,
}: {
  workspaceId: string;
  userId: string;
  notificationId: string;
}) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientId, userId)
      )
    );
}

export async function markAllNotificationsRead({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.workspaceId, workspaceId),
        eq(notifications.recipientId, userId)
      )
    );
}
