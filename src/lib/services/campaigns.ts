import { db } from "@/db";
import { campaigns, activities } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

export async function createCampaign({
  workspaceId,
  createdById,
  name,
  description,
  startDate,
  endDate,
}: {
  workspaceId: string;
  createdById: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Campaign name is required.");
  }

  const [campaign] = await db
    .insert(campaigns)
    .values({
      id: `camp-${crypto.randomUUID()}`,
      workspaceId,
      name: trimmedName,
      description: description?.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: "active",
      createdById,
    })
    .returning();

  return campaign;
}

export async function listCampaigns(workspaceId: string) {
  const campaignList = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      status: campaigns.status,
      startDate: campaigns.startDate,
      endDate: campaigns.endDate,
      createdAt: campaigns.createdAt,
      activityCount: sql<number>`count(${activities.id})`,
    })
    .from(campaigns)
    .leftJoin(activities, eq(activities.campaignId, campaigns.id))
    .where(eq(campaigns.workspaceId, workspaceId))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt));

  return campaignList;
}

export async function getCampaignById(workspaceId: string, campaignId: string) {
  const rows = await db
    .select()
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId))
    )
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

export async function updateCampaign({
  workspaceId,
  campaignId,
  name,
  description,
  status,
  startDate,
  endDate,
}: {
  workspaceId: string;
  campaignId: string;
  name?: string;
  description?: string;
  status?: "active" | "completed" | "archived";
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  const updates: Partial<typeof campaigns.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Campaign name cannot be empty.");
    updates.name = trimmed;
  }

  if (description !== undefined) {
    updates.description = description.trim() || null;
  }

  if (status !== undefined) {
    updates.status = status;
  }

  if (startDate !== undefined) {
    updates.startDate = startDate;
  }

  if (endDate !== undefined) {
    updates.endDate = endDate;
  }

  const [updated] = await db
    .update(campaigns)
    .set(updates)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId))
    )
    .returning();

  return updated;
}
