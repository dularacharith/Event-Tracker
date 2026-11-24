import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UpdateProfileInput {
  displayName?: string;
  jobTitle?: string;
  timezone?: string;
  avatarUrl?: string;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
) {
  const updates: Partial<typeof userTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.displayName !== undefined) {
    const trimmed = input.displayName.trim();
    if (trimmed.length > 0) {
      updates.displayName = trimmed;
    }
  }

  if (input.jobTitle !== undefined) {
    updates.jobTitle = input.jobTitle.trim();
  }

  if (input.timezone !== undefined) {
    updates.timezone = input.timezone.trim() || "UTC";
  }

  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = input.avatarUrl;
  }

  const [updatedUser] = await db
    .update(userTable)
    .set(updates)
    .where(eq(userTable.id, userId))
    .returning();

  return updatedUser;
}
