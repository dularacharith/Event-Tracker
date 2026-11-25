import { db } from "@/db";
import { campaigns, activities } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

let tableEnsured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureCampaignsTable() {
  if (tableEnsured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      await db.execute(sql`
        ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "color" text;
      `);
      tableEnsured = true;
    } catch (err) {
      console.error("ensureCampaignsTable error:", err);
    } finally {
      ensurePromise = null;
    }
  })();

  return ensurePromise;
}

export async function createCampaign({
  workspaceId,
  createdById,
  name,
  description,
  color,
  startDate,
  endDate,
}: {
  workspaceId: string;
  createdById: string;
  name: string;
  description?: string;
  color?: string | null;
  startDate?: Date;
  endDate?: Date;
}) {
  await ensureCampaignsTable();
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
      color: color?.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: "active",
      createdById,
    })
    .returning();

  return campaign;
}

export async function listCampaigns(workspaceId: string) {
  await ensureCampaignsTable();
  const campaignList = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      status: campaigns.status,
      color: campaigns.color,
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
  await ensureCampaignsTable();
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
  color,
  startDate,
  endDate,
}: {
  workspaceId: string;
  campaignId: string;
  name?: string;
  description?: string;
  status?: string;
  color?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  await ensureCampaignsTable();
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

  if (color !== undefined) {
    updates.color = color;
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

export async function deleteCampaign(workspaceId: string, campaignId: string) {
  await ensureCampaignsTable();
  const [deleted] = await db
    .delete(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId))
    )
    .returning();

  return deleted;
}
