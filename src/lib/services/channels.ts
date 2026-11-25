import { db } from "@/db";
import { channels, activities } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import crypto from "crypto";

let tableEnsured = false;

export async function ensureChannelsTable() {
  if (tableEnsured) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "channels" (
        "id" text PRIMARY KEY NOT NULL,
        "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "platform" text,
        "description" text,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await db.execute(sql`
      ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "channel_id" text;
    `);
    tableEnsured = true;
  } catch (err) {
    // Silently continue if table already exists or DDL is restricted
    tableEnsured = true;
  }
}

export interface CreateChannelInput {
  workspaceId: string;
  name: string;
  platform?: string | null;
  description?: string | null;
}

export async function createChannel({
  workspaceId,
  name,
  platform,
  description,
}: CreateChannelInput) {
  await ensureChannelsTable();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Channel name is required.");
  }

  const [channel] = await db
    .insert(channels)
    .values({
      id: `chan-${crypto.randomUUID()}`,
      workspaceId,
      name: trimmedName,
      platform: platform?.trim() || null,
      description: description?.trim() || null,
    })
    .returning();

  return channel;
}

export async function listChannels(workspaceId: string) {
  await ensureChannelsTable();
  const items = await db
    .select({
      id: channels.id,
      workspaceId: channels.workspaceId,
      name: channels.name,
      platform: channels.platform,
      description: channels.description,
      createdAt: channels.createdAt,
      activityCount: sql<number>`count(${activities.id})`,
    })
    .from(channels)
    .leftJoin(activities, eq(activities.channelId, channels.id))
    .where(eq(channels.workspaceId, workspaceId))
    .groupBy(channels.id)
    .orderBy(asc(channels.name));

  return items;
}
