import { db } from "@/db";
import {
  invites,
  workspaceMembers,
  user as userTable,
  workspaces,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

export async function createInvite({
  workspaceId,
  invitedById,
  email,
  role = "member",
  expiresInDays = 7,
}: {
  workspaceId: string;
  invitedById: string;
  email: string;
  role?: "admin" | "member";
  expiresInDays?: number;
}) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if a member with this email is already active
  const existingActiveMember = await db
    .select({
      memberId: workspaceMembers.id,
      email: userTable.email,
    })
    .from(workspaceMembers)
    .innerJoin(userTable, eq(workspaceMembers.userId, userTable.id))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(userTable.email, normalizedEmail),
        eq(workspaceMembers.status, "active")
      )
    )
    .limit(1);

  if (existingActiveMember.length > 0) {
    throw new Error("A teammate with this email address is already an active member of this workspace.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(invites)
    .values({
      id: `inv-${crypto.randomUUID()}`,
      workspaceId,
      email: normalizedEmail,
      role,
      token,
      invitedById,
      expiresAt,
    })
    .returning();

  return invite;
}

export async function revokeInvite({
  workspaceId,
  inviteId,
}: {
  workspaceId: string;
  inviteId: string;
}) {
  const existing = await db
    .select()
    .from(invites)
    .where(
      and(eq(invites.id, inviteId), eq(invites.workspaceId, workspaceId))
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Invite not found.");
  }

  const invite = existing[0];
  if (invite.acceptedAt) {
    throw new Error("Cannot revoke an invite that has already been accepted.");
  }

  if (invite.revokedAt) {
    return invite; // already revoked
  }

  const [revoked] = await db
    .update(invites)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(invites.id, inviteId))
    .returning();

  return revoked;
}

export async function getInviteStatus(token: string) {
  const found = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (found.length === 0) {
    return { status: "not_found" as const, invite: null };
  }

  const invite = found[0];
  const now = new Date();

  if (invite.revokedAt) {
    return { status: "revoked" as const, invite };
  }

  if (invite.acceptedAt) {
    return { status: "already_used" as const, invite };
  }

  if (new Date(invite.expiresAt).getTime() <= now.getTime()) {
    return { status: "expired" as const, invite };
  }

  return { status: "valid" as const, invite };
}

export async function acceptInvite({
  token,
  user,
}: {
  token: string;
  user: typeof userTable.$inferSelect;
}) {
  const normalizedUserEmail = (user.email || "").trim().toLowerCase();

  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Invite not found.");
    }

    const invite = existing[0];
    const now = new Date();

    if (invite.revokedAt) {
      throw new Error("This invite has been revoked by an administrator.");
    }

    if (invite.acceptedAt) {
      throw new Error("This invite has already been accepted and cannot be reused.");
    }

    if (new Date(invite.expiresAt).getTime() <= now.getTime()) {
      throw new Error("This invite has expired.");
    }

    // Verify matching email
    if (invite.email.toLowerCase() !== normalizedUserEmail) {
      throw new Error(
        `This invite was created for ${invite.email}. You are currently signed in as ${normalizedUserEmail}. Please sign in with the invited email address.`
      );
    }

    // Mark invite accepted
    await tx
      .update(invites)
      .set({
        acceptedAt: now,
        acceptedById: user.id,
      })
      .where(eq(invites.id, invite.id));

    // Upsert workspace membership
    const existingMember = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, invite.workspaceId),
          eq(workspaceMembers.userId, user.id)
        )
      )
      .limit(1);

    let member;
    if (existingMember.length > 0) {
      const [updated] = await tx
        .update(workspaceMembers)
        .set({
          role: invite.role,
          status: "active",
          updatedAt: now,
        })
        .where(eq(workspaceMembers.id, existingMember[0].id))
        .returning();
      member = updated;
    } else {
      const [created] = await tx
        .insert(workspaceMembers)
        .values({
          id: `wm-${user.id}`,
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
          status: "active",
        })
        .returning();
      member = created;
    }

    // Set initial display name if missing
    if (!user.displayName) {
      await tx
        .update(userTable)
        .set({
          displayName: user.name || normalizedUserEmail.split("@")[0],
          updatedAt: now,
        })
        .where(eq(userTable.id, user.id));
    }

    return { success: true, member };
  });
}

export async function listWorkspaceMembers(workspaceId: string) {
  const members = await db
    .select({
      memberId: workspaceMembers.id,
      userId: userTable.id,
      name: userTable.name,
      displayName: userTable.displayName,
      email: userTable.email,
      image: userTable.image,
      avatarUrl: userTable.avatarUrl,
      jobTitle: userTable.jobTitle,
      timezone: userTable.timezone,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      joinedAt: workspaceMembers.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(userTable, eq(workspaceMembers.userId, userTable.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(desc(workspaceMembers.createdAt));

  return members;
}

export async function listWorkspaceInvites(workspaceId: string) {
  const inviteList = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      token: invites.token,
      expiresAt: invites.expiresAt,
      revokedAt: invites.revokedAt,
      acceptedAt: invites.acceptedAt,
      createdAt: invites.createdAt,
      invitedBy: {
        id: userTable.id,
        name: userTable.name,
        displayName: userTable.displayName,
      },
    })
    .from(invites)
    .innerJoin(userTable, eq(invites.invitedById, userTable.id))
    .where(eq(invites.workspaceId, workspaceId))
    .orderBy(desc(invites.createdAt));

  return inviteList;
}

export async function removeTeammate({
  workspaceId,
  memberId,
  requestingUserId,
}: {
  workspaceId: string;
  memberId: string;
  requestingUserId: string;
}) {
  const memberToRemove = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (memberToRemove.length === 0) {
    throw new Error("Teammate membership record not found.");
  }

  const target = memberToRemove[0];

  // Prevent admin from deactivating themselves if they are the sole active admin
  if (target.userId === requestingUserId && target.role === "admin") {
    const activeAdmins = await db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, "admin"),
          eq(workspaceMembers.status, "active")
        )
      );

    if (Number(activeAdmins[0]?.count || 0) <= 1) {
      throw new Error("You cannot remove or deactivate the only active admin in the workspace.");
    }
  }

  const [updated] = await db
    .update(workspaceMembers)
    .set({
      status: "deactivated",
      updatedAt: new Date(),
    })
    .where(eq(workspaceMembers.id, memberId))
    .returning();

  return updated;
}
