import { auth } from "./auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspaces, workspaceMembers, user as userTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const SHARED_WORKSPACE_SLUG = "default";
export const SHARED_WORKSPACE_NAME = "CampaignFlow Workspace";

export interface CurrentAuthContext {
  user: typeof userTable.$inferSelect | null;
  member: typeof workspaceMembers.$inferSelect | null;
  workspace: typeof workspaces.$inferSelect | null;
}

export async function getOrCreateSharedWorkspace(tx: any = db) {
  const existing = await tx
    .select()
    .from(workspaces)
    .where(eq(workspaces.slug, SHARED_WORKSPACE_SLUG))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [created] = await tx
    .insert(workspaces)
    .values({
      id: "cf-workspace-main",
      name: SHARED_WORKSPACE_NAME,
      slug: SHARED_WORKSPACE_SLUG,
    })
    .returning();

  return created;
}

export async function bootstrapFirstAdminIfNeeded(
  currentUser: typeof userTable.$inferSelect,
  tx: any = db
) {
  const firstAdminEmail = (
    process.env.FIRST_ADMIN_EMAIL ||
    process.env.INITIAL_ADMIN_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();

  if (!firstAdminEmail) {
    return null;
  }

  const userEmail = (currentUser.email || "").trim().toLowerCase();
  if (userEmail !== firstAdminEmail) {
    return null;
  }

  const workspace = await getOrCreateSharedWorkspace(tx);

  // Check if this user is already a member
  const existingMember = await tx
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.userId, currentUser.id)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    return existingMember[0];
  }

  // Check if any admin already exists in the workspace
  const existingAdmins = await tx
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.role, "admin"),
        eq(workspaceMembers.status, "active")
      )
    )
    .limit(1);

  if (existingAdmins.length === 0) {
    // This is the configured first admin! Enroll them once as admin.
    const [member] = await tx
      .insert(workspaceMembers)
      .values({
        id: `wm-${currentUser.id}`,
        workspaceId: workspace.id,
        userId: currentUser.id,
        role: "admin",
        status: "active",
      })
      .returning();

    // Set initial display name if not present
    if (!currentUser.displayName) {
      await tx
        .update(userTable)
        .set({
          displayName: currentUser.name || "Admin",
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, currentUser.id));
    }

    return member;
  }

  return null;
}

export async function getCurrentAuth(
  reqHeaders?: Headers
): Promise<CurrentAuthContext> {
  const h = reqHeaders || (await headers());

  // Check for test session header or cookie in non-production environments
  let testUserId =
    process.env.NODE_ENV !== "production" ? h.get("x-test-user-id") : null;

  if (!testUserId && process.env.NODE_ENV !== "production") {
    const cookieHeader = h.get("cookie") || "";
    const match = cookieHeader.match(/cf_dev_user_id=([^;]+)/);
    if (match) {
      testUserId = match[1];
    }
  }

  let sessionUser: typeof userTable.$inferSelect | null = null;

  if (testUserId) {
    const found = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, testUserId))
      .limit(1);
    if (found.length > 0) {
      sessionUser = found[0];
    }
  } else {
    try {
      const session = await auth.api.getSession({
        headers: h,
      });
      if (session?.user) {
        const found = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, session.user.id))
          .limit(1);
        if (found.length > 0) {
          sessionUser = found[0];
        }
      }
    } catch {
      // Session retrieval failed or not authenticated
    }
  }

  if (!sessionUser) {
    return { user: null, member: null, workspace: null };
  }

  const workspace = await getOrCreateSharedWorkspace();

  // Attempt first admin bootstrap if configured
  await bootstrapFirstAdminIfNeeded(sessionUser);

  // Look up active workspace membership
  const members = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.userId, sessionUser.id),
        eq(workspaceMembers.status, "active")
      )
    )
    .limit(1);

  const member = members.length > 0 ? members[0] : null;

  return {
    user: sessionUser,
    member,
    workspace,
  };
}

export async function requireActiveMember(reqHeaders?: Headers) {
  const { user, member, workspace } = await getCurrentAuth(reqHeaders);

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!member || member.status !== "active") {
    throw new Error("FORBIDDEN_NOT_A_MEMBER");
  }

  return { user, member, workspace: workspace! };
}

export async function requireAdmin(reqHeaders?: Headers) {
  const { user, member, workspace } = await requireActiveMember(reqHeaders);

  if (member.role !== "admin") {
    throw new Error("FORBIDDEN_ADMIN_REQUIRED");
  }

  return { user, member, workspace };
}
