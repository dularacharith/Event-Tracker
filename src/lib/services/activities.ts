import { db } from "@/db";
import {
  activities,
  activityEvidence,
  reviewAttempts,
  activityStatusHistory,
  activityComments,
  notifications,
  workspaceMembers,
  user as userTable,
  campaigns,
  channels,
  mediaFiles,
} from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
import { ensureChannelsTable } from "./channels";

export type SocialPlatform =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "threads";

export type ContentType =
  | "post"
  | "reel"
  | "video"
  | "reel_video"
  | "story"
  | "thread"
  | "carousel"
  | "article";

export type ActivityStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "awaiting_review"
  | "passed"
  | "failed";

export interface CreateActivityInput {
  workspaceId: string;
  campaignId: string;
  channelId?: string | null;
  title: string;
  brief: string;
  socialPlatform: SocialPlatform;
  contentType: ContentType;
  scheduledAt?: Date | null;
  reviewDeadline?: Date | null;
  ownerId?: string | null;
  reviewerId?: string | null;
  passCriteria?: string;
  createdById: string;
  initialStatus?: "draft" | "scheduled";
}

/**
 * Validates scheduling constraints:
 * Requires owner, eligible reviewer (active, neither creator nor owner),
 * non-empty pass criteria, and review deadline after scheduled time.
 */
export async function validateSchedulingRules({
  workspaceId,
  ownerId,
  reviewerId,
  passCriteria,
  scheduledAt,
  reviewDeadline,
  createdById,
}: {
  workspaceId: string;
  ownerId?: string | null;
  reviewerId?: string | null;
  passCriteria?: string | null;
  scheduledAt?: Date | null;
  reviewDeadline?: Date | null;
  createdById: string;
}) {
  if (!ownerId) {
    throw new Error("To schedule an activity, an owner must be assigned.");
  }

  if (!reviewerId) {
    throw new Error("To schedule an activity, an eligible reviewer must be assigned.");
  }

  if (reviewerId === ownerId) {
    throw new Error("The reviewer cannot be the owner of the activity (self-review is prohibited).");
  }

  if (reviewerId === createdById) {
    throw new Error("The reviewer cannot be the creator of the activity.");
  }

  if (!passCriteria || passCriteria.trim().length === 0) {
    throw new Error("To schedule an activity, pass criteria must be specified.");
  }

  if (!scheduledAt) {
    throw new Error("To schedule an activity, a scheduled date and time is required.");
  }

  if (!reviewDeadline) {
    throw new Error("To schedule an activity, a review deadline is required.");
  }

  const schedTime = new Date(scheduledAt).getTime();
  const deadlineTime = new Date(reviewDeadline).getTime();

  if (deadlineTime <= schedTime) {
    throw new Error("Review deadline must be strictly after the scheduled time.");
  }

  // Validate that owner and reviewer are active workspace teammates
  const activeMembers = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.status, "active"),
        inArray(workspaceMembers.userId, [ownerId, reviewerId])
      )
    );

  const activeUserIds = new Set(activeMembers.map((m) => m.userId));
  if (!activeUserIds.has(ownerId)) {
    throw new Error("Assigned owner is not an active teammate in this workspace.");
  }
  if (!activeUserIds.has(reviewerId)) {
    throw new Error("Assigned reviewer is not an active teammate in this workspace.");
  }
}

export async function createActivity(input: CreateActivityInput) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Activity title is required.");
  }
  const brief = input.brief.trim();
  if (!brief) {
    throw new Error("Activity brief is required.");
  }

  const status: ActivityStatus = input.initialStatus || "draft";

  if (status === "scheduled") {
    await validateSchedulingRules({
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      reviewerId: input.reviewerId,
      passCriteria: input.passCriteria,
      scheduledAt: input.scheduledAt,
      reviewDeadline: input.reviewDeadline,
      createdById: input.createdById,
    });
  }

  const activityId = `act-${crypto.randomUUID()}`;

  await ensureChannelsTable();

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(activities)
      .values({
        id: activityId,
        campaignId: input.campaignId,
        channelId: input.channelId || null,
        workspaceId: input.workspaceId,
        title,
        brief,
        socialPlatform: input.socialPlatform,
        contentType: input.contentType,
        scheduledAt: input.scheduledAt || null,
        reviewDeadline: input.reviewDeadline || null,
        ownerId: input.ownerId || null,
        reviewerId: input.reviewerId || null,
        passCriteria: input.passCriteria?.trim() || "",
        status,
        currentAttemptNumber: 0,
        createdById: input.createdById,
      })
      .returning();

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: "none",
      toStatus: status,
      changedById: input.createdById,
      reason: "Activity created",
    });

    return created;
  });
}

export async function scheduleActivity({
  workspaceId,
  activityId,
  scheduledAt,
  reviewDeadline,
  ownerId,
  reviewerId,
  passCriteria,
  changedById,
}: {
  workspaceId: string;
  activityId: string;
  scheduledAt: Date;
  reviewDeadline: Date;
  ownerId: string;
  reviewerId: string;
  passCriteria: string;
  changedById: string;
}) {
  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Activity not found.");
  }

  const act = existing[0];

  await validateSchedulingRules({
    workspaceId,
    ownerId,
    reviewerId,
    passCriteria,
    scheduledAt,
    reviewDeadline,
    createdById: act.createdById,
  });

  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(activities)
      .set({
        ownerId,
        reviewerId,
        passCriteria: passCriteria.trim(),
        scheduledAt,
        reviewDeadline,
        status: "scheduled",
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId))
      .returning();

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: act.status,
      toStatus: "scheduled",
      changedById,
      reason: "Activity scheduled",
    });

    return updated;
  });
}

export async function startProgress({
  workspaceId,
  activityId,
  userId,
}: {
  workspaceId: string;
  activityId: string;
  userId: string;
}) {
  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Activity not found.");
  }

  const act = existing[0];
  if (act.status !== "scheduled") {
    throw new Error(`Cannot start progress from '${act.status}' status.`);
  }

  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(activities)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId))
      .returning();

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: "scheduled",
      toStatus: "in_progress",
      changedById: userId,
      reason: "Work started",
    });

    return updated;
  });
}

/**
 * Rule: The owner submits the activity for review with at least one piece of evidence.
 * Snapshots criteria and evidence for this review attempt.
 */
export async function submitForReview({
  workspaceId,
  activityId,
  ownerId,
}: {
  workspaceId: string;
  activityId: string;
  ownerId: string;
}) {
  return await db.transaction(async (tx) => {
    const [act] = await tx
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!act) {
      throw new Error("Activity not found.");
    }

    if (act.ownerId !== ownerId) {
      throw new Error("Only the assigned owner can submit an activity for review.");
    }

    if (
      act.status !== "in_progress" &&
      act.status !== "scheduled" &&
      act.status !== "draft"
    ) {
      throw new Error(`Cannot submit for review from current status: ${act.status}`);
    }

    if (!act.reviewerId) {
      throw new Error("An eligible reviewer must be assigned before submitting for review.");
    }

    // Check evidence count (at least one piece of evidence required)
    const evidenceList = await tx
      .select({
        id: activityEvidence.id,
        type: activityEvidence.type,
        mediaFileId: activityEvidence.mediaFileId,
        externalUrl: activityEvidence.externalUrl,
        caption: activityEvidence.caption,
        createdAt: activityEvidence.createdAt,
      })
      .from(activityEvidence)
      .where(eq(activityEvidence.activityId, activityId));

    if (evidenceList.length === 0) {
      throw new Error("At least one piece of evidence (screenshot or link) is required to submit for review.");
    }

    const nextAttemptNumber = (act.currentAttemptNumber || 0) + 1;
    const now = new Date();

    // Snapshot criteria and evidence for this review attempt
    await tx.insert(reviewAttempts).values({
      id: `rev-${crypto.randomUUID()}`,
      activityId,
      attemptNumber: nextAttemptNumber,
      submittedById: ownerId,
      submittedAt: now,
      criteriaSnapshot: act.passCriteria,
      evidenceSnapshot: JSON.stringify(evidenceList),
      reviewerId: act.reviewerId,
      verdict: null,
      verdictReason: null,
    });

    const [updatedAct] = await tx
      .update(activities)
      .set({
        status: "awaiting_review",
        currentAttemptNumber: nextAttemptNumber,
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))
      .returning();

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: act.status,
      toStatus: "awaiting_review",
      changedById: ownerId,
      reason: `Submitted for review (Attempt #${nextAttemptNumber})`,
    });

    // Notify assigned reviewer
    await tx.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      workspaceId,
      recipientId: act.reviewerId,
      actorId: ownerId,
      activityId,
      type: "review_requested",
      title: "Review Requested",
      message: `Activity "${act.title}" is ready for your review.`,
    });

    return updatedAct;
  });
}

/**
 * Reviewer decision:
 * Only assigned reviewer can decide.
 * Only while awaiting review.
 * Reviewer must be active teammate who is neither creator nor owner.
 * Reason is required for both passed and failed.
 * Saved atomically in interactive transaction with status history.
 * Rejects stale or duplicate submissions.
 */
export async function recordReviewVerdict({
  workspaceId,
  activityId,
  reviewerId,
  verdict,
  verdictReason,
}: {
  workspaceId: string;
  activityId: string;
  reviewerId: string;
  verdict: "passed" | "failed";
  verdictReason: string;
}) {
  const reasonTrimmed = verdictReason.trim();
  if (!reasonTrimmed) {
    throw new Error(`A written reason is required when marking an activity as ${verdict}.`);
  }

  return await db.transaction(async (tx) => {
    // Select activity and check status atomically
    const [act] = await tx
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!act) {
      throw new Error("Activity not found.");
    }

    if (act.status !== "awaiting_review") {
      throw new Error("This activity is not currently awaiting review, or a decision has already been recorded.");
    }

    // Enforce assigned reviewer check
    if (act.reviewerId !== reviewerId) {
      throw new Error("Only the assigned reviewer can record a verdict. Admins cannot override reviewer decisions.");
    }

    // Enforce neither creator nor owner check
    if (reviewerId === act.ownerId) {
      throw new Error("The assigned reviewer cannot be the owner (self-review is prohibited).");
    }
    if (reviewerId === act.createdById) {
      throw new Error("The assigned reviewer cannot be the creator of the activity.");
    }

    // Verify reviewer is active teammate
    const [activeMember] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, reviewerId),
          eq(workspaceMembers.status, "active")
        )
      )
      .limit(1);

    if (!activeMember) {
      throw new Error("Reviewer is not an active member of this workspace.");
    }

    // Find the current open review attempt
    const [attempt] = await tx
      .select()
      .from(reviewAttempts)
      .where(
        and(
          eq(reviewAttempts.activityId, activityId),
          eq(reviewAttempts.attemptNumber, act.currentAttemptNumber)
        )
      )
      .limit(1);

    if (!attempt || attempt.verdict !== null) {
      throw new Error("This review attempt has already received a verdict.");
    }

    const now = new Date();

    // 1. Update review attempt with verdict & reason
    await tx
      .update(reviewAttempts)
      .set({
        verdict,
        verdictReason: reasonTrimmed,
        decidedAt: now,
        decidedById: reviewerId,
      })
      .where(eq(reviewAttempts.id, attempt.id));

    // 2. Update activity status
    const [updatedAct] = await tx
      .update(activities)
      .set({
        status: verdict,
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))
      .returning();

    // 3. Append to status history
    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: "awaiting_review",
      toStatus: verdict,
      changedById: reviewerId,
      reason: reasonTrimmed,
    });

    // 4. Notify owner
    if (act.ownerId) {
      await tx.insert(notifications).values({
        id: `notif-${crypto.randomUUID()}`,
        workspaceId,
        recipientId: act.ownerId,
        actorId: reviewerId,
        activityId,
        type: "review_decided",
        title: `Review ${verdict === "passed" ? "Passed" : "Failed"}`,
        message: `Your activity "${act.title}" was marked ${verdict.toUpperCase()}: ${reasonTrimmed}`,
      });
    }

    return updatedAct;
  });
}

/**
 * Reschedules failed work without erasing previous verdicts or reasons.
 * Allowed for owner or admin.
 */
export async function rescheduleActivity({
  workspaceId,
  activityId,
  userId,
  userRole,
  scheduledAt,
  reviewDeadline,
  passCriteria,
  rescheduleReason,
}: {
  workspaceId: string;
  activityId: string;
  userId: string;
  userRole: "admin" | "member";
  scheduledAt: Date;
  reviewDeadline: Date;
  passCriteria?: string;
  rescheduleReason?: string;
}) {
  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Activity not found.");
  }

  const act = existing[0];

  // Only owner or admin can reschedule
  if (act.ownerId !== userId && userRole !== "admin") {
    throw new Error("Only the activity owner or an admin can reschedule this activity.");
  }

  if (act.status !== "failed" && act.status !== "draft" && act.status !== "scheduled") {
    throw new Error(`Cannot reschedule activity in status '${act.status}'.`);
  }

  const schedTime = new Date(scheduledAt).getTime();
  const deadlineTime = new Date(reviewDeadline).getTime();

  if (deadlineTime <= schedTime) {
    throw new Error("Review deadline must be strictly after the new scheduled time.");
  }

  const criteriaToUse = passCriteria !== undefined ? passCriteria.trim() : act.passCriteria;
  if (!criteriaToUse) {
    throw new Error("Pass criteria cannot be empty.");
  }

  return await db.transaction(async (tx) => {
    const now = new Date();

    const [updated] = await tx
      .update(activities)
      .set({
        scheduledAt,
        reviewDeadline,
        passCriteria: criteriaToUse,
        status: "scheduled",
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))
      .returning();

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: act.status,
      toStatus: "scheduled",
      changedById: userId,
      reason: rescheduleReason
        ? `Rescheduled: ${rescheduleReason}`
        : "Activity rescheduled for another iteration",
    });

    return updated;
  });
}

/**
 * Reassign reviewer:
 * Admins have no override on the verdict, but CAN assign a different eligible reviewer.
 */
export async function reassignReviewer({
  workspaceId,
  activityId,
  adminId,
  newReviewerId,
}: {
  workspaceId: string;
  activityId: string;
  adminId: string;
  newReviewerId: string;
}) {
  return await db.transaction(async (tx) => {
    const [act] = await tx
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!act) {
      throw new Error("Activity not found.");
    }

    if (newReviewerId === act.ownerId) {
      throw new Error("The reviewer cannot be the owner of the activity.");
    }
    if (newReviewerId === act.createdById) {
      throw new Error("The reviewer cannot be the creator of the activity.");
    }

    // Verify new reviewer is active member
    const [member] = await tx
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, newReviewerId),
          eq(workspaceMembers.status, "active")
        )
      )
      .limit(1);

    if (!member) {
      throw new Error("Assigned reviewer is not an active teammate.");
    }

    const now = new Date();

    // Update activity
    const [updated] = await tx
      .update(activities)
      .set({
        reviewerId: newReviewerId,
        updatedAt: now,
      })
      .where(eq(activities.id, activityId))
      .returning();

    // If awaiting review, update the reviewer in current open attempt
    if (act.status === "awaiting_review" && act.currentAttemptNumber > 0) {
      await tx
        .update(reviewAttempts)
        .set({ reviewerId: newReviewerId })
        .where(
          and(
            eq(reviewAttempts.activityId, activityId),
            eq(reviewAttempts.attemptNumber, act.currentAttemptNumber)
          )
        );
    }

    await tx.insert(activityStatusHistory).values({
      id: `ash-${crypto.randomUUID()}`,
      activityId,
      fromStatus: act.status,
      toStatus: act.status,
      changedById: adminId,
      reason: `Reviewer reassigned to new teammate`,
    });

    await tx.insert(notifications).values({
      id: `notif-${crypto.randomUUID()}`,
      workspaceId,
      recipientId: newReviewerId,
      actorId: adminId,
      activityId,
      type: "reviewer_assigned",
      title: "Reviewer Assignment",
      message: `You were assigned as reviewer for "${act.title}".`,
    });

    return updated;
  });
}

/**
 * Add evidence (screenshot or external link)
 */
export async function addEvidence({
  activityId,
  userId,
  type,
  mediaFileId,
  externalUrl,
  caption,
}: {
  activityId: string;
  userId: string;
  type: "screenshot" | "external_link";
  mediaFileId?: string;
  externalUrl?: string;
  caption?: string;
}) {
  if (type === "screenshot" && !mediaFileId) {
    throw new Error("Screenshot evidence requires a valid uploaded media file.");
  }

  if (type === "external_link") {
    const trimmedUrl = (externalUrl || "").trim();
    if (!trimmedUrl || (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://"))) {
      throw new Error("External link evidence requires a valid URL starting with http:// or https://");
    }
  }

  const [evidence] = await db
    .insert(activityEvidence)
    .values({
      id: `evi-${crypto.randomUUID()}`,
      activityId,
      type,
      mediaFileId: mediaFileId || null,
      externalUrl: externalUrl?.trim() || null,
      caption: caption?.trim() || null,
      createdById: userId,
    })
    .returning();

  return evidence;
}

/**
 * Remove evidence item
 */
export async function removeEvidence({
  activityId,
  evidenceId,
  userId,
  userRole,
}: {
  activityId: string;
  evidenceId: string;
  userId: string;
  userRole: "admin" | "member";
}) {
  const [act] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!act) throw new Error("Activity not found.");

  if (act.status === "awaiting_review" || act.status === "passed") {
    throw new Error("Cannot remove evidence while activity is awaiting review or has passed.");
  }

  if (act.ownerId !== userId && act.createdById !== userId && userRole !== "admin") {
    throw new Error("You do not have permission to remove this evidence item.");
  }

  await db
    .delete(activityEvidence)
    .where(
      and(
        eq(activityEvidence.id, evidenceId),
        eq(activityEvidence.activityId, activityId)
      )
    );

  return { success: true };
}

/**
 * Add comment to an activity
 */
export async function addComment({
  activityId,
  authorId,
  content,
}: {
  activityId: string;
  authorId: string;
  content: string;
}) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Comment content cannot be empty.");
  }

  const [comment] = await db
    .insert(activityComments)
    .values({
      id: `comm-${crypto.randomUUID()}`,
      activityId,
      authorId,
      content: trimmed,
    })
    .returning();

  return comment;
}

/**
 * Get detailed activity by ID with comments, evidence, history, and review attempts
 */
export async function getActivityDetails(workspaceId: string, activityId: string) {
  await ensureChannelsTable();

  let act: any = null;
  try {
    const [result] = await db
      .select({
        id: activities.id,
        campaignId: activities.campaignId,
        workspaceId: activities.workspaceId,
        title: activities.title,
        brief: activities.brief,
        socialPlatform: activities.socialPlatform,
        contentType: activities.contentType,
        scheduledAt: activities.scheduledAt,
        reviewDeadline: activities.reviewDeadline,
        ownerId: activities.ownerId,
        reviewerId: activities.reviewerId,
        passCriteria: activities.passCriteria,
        status: activities.status,
        currentAttemptNumber: activities.currentAttemptNumber,
        createdById: activities.createdById,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        campaignName: campaigns.name,
        channelId: activities.channelId,
        channelName: channels.name,
      })
      .from(activities)
      .leftJoin(campaigns, eq(activities.campaignId, campaigns.id))
      .leftJoin(channels, eq(activities.channelId, channels.id))
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);
    act = result;
  } catch (err: any) {
    console.error("getActivityDetails query error, using fallback:", err?.message);
    const [result] = await db
      .select({
        id: activities.id,
        campaignId: activities.campaignId,
        workspaceId: activities.workspaceId,
        title: activities.title,
        brief: activities.brief,
        socialPlatform: activities.socialPlatform,
        contentType: activities.contentType,
        scheduledAt: activities.scheduledAt,
        reviewDeadline: activities.reviewDeadline,
        ownerId: activities.ownerId,
        reviewerId: activities.reviewerId,
        passCriteria: activities.passCriteria,
        status: activities.status,
        currentAttemptNumber: activities.currentAttemptNumber,
        createdById: activities.createdById,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        campaignName: campaigns.name,
        channelId: sql<string | null>`null`.as("channel_id"),
        channelName: sql<string | null>`null`.as("channel_name"),
      })
      .from(activities)
      .leftJoin(campaigns, eq(activities.campaignId, campaigns.id))
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);
    act = result;
  }

  if (!act) return null;

  // Fetch owner, reviewer, creator user profiles
  const userIds = [act.ownerId, act.reviewerId, act.createdById].filter(
    Boolean
  ) as string[];

  const users =
    userIds.length > 0
      ? await db
          .select({
            id: userTable.id,
            name: userTable.name,
            displayName: userTable.displayName,
            email: userTable.email,
            image: userTable.image,
            avatarUrl: userTable.avatarUrl,
            jobTitle: userTable.jobTitle,
          })
          .from(userTable)
          .where(inArray(userTable.id, userIds))
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Fetch evidence list
  const evidence = await db
    .select({
      id: activityEvidence.id,
      type: activityEvidence.type,
      mediaFileId: activityEvidence.mediaFileId,
      externalUrl: activityEvidence.externalUrl,
      caption: activityEvidence.caption,
      createdAt: activityEvidence.createdAt,
      createdById: activityEvidence.createdById,
      mediaFile: {
        id: mediaFiles.id,
        originalName: mediaFiles.originalName,
        mimeType: mediaFiles.mimeType,
        sizeBytes: mediaFiles.sizeBytes,
      },
    })
    .from(activityEvidence)
    .leftJoin(mediaFiles, eq(activityEvidence.mediaFileId, mediaFiles.id))
    .where(eq(activityEvidence.activityId, activityId))
    .orderBy(desc(activityEvidence.createdAt));

  // Fetch comments
  const comments = await db
    .select({
      id: activityComments.id,
      content: activityComments.content,
      createdAt: activityComments.createdAt,
      author: {
        id: userTable.id,
        name: userTable.name,
        displayName: userTable.displayName,
        image: userTable.image,
        avatarUrl: userTable.avatarUrl,
        jobTitle: userTable.jobTitle,
      },
    })
    .from(activityComments)
    .innerJoin(userTable, eq(activityComments.authorId, userTable.id))
    .where(eq(activityComments.activityId, activityId))
    .orderBy(desc(activityComments.createdAt));

  // Fetch status history
  const history = await db
    .select({
      id: activityStatusHistory.id,
      fromStatus: activityStatusHistory.fromStatus,
      toStatus: activityStatusHistory.toStatus,
      reason: activityStatusHistory.reason,
      createdAt: activityStatusHistory.createdAt,
      actor: {
        id: userTable.id,
        name: userTable.name,
        displayName: userTable.displayName,
        image: userTable.image,
        avatarUrl: userTable.avatarUrl,
      },
    })
    .from(activityStatusHistory)
    .innerJoin(userTable, eq(activityStatusHistory.changedById, userTable.id))
    .where(eq(activityStatusHistory.activityId, activityId))
    .orderBy(desc(activityStatusHistory.createdAt));

  // Fetch review attempts
  const attempts = await db
    .select({
      id: reviewAttempts.id,
      attemptNumber: reviewAttempts.attemptNumber,
      submittedAt: reviewAttempts.submittedAt,
      criteriaSnapshot: reviewAttempts.criteriaSnapshot,
      evidenceSnapshot: reviewAttempts.evidenceSnapshot,
      verdict: reviewAttempts.verdict,
      verdictReason: reviewAttempts.verdictReason,
      decidedAt: reviewAttempts.decidedAt,
      reviewerId: reviewAttempts.reviewerId,
      submittedBy: {
        id: userTable.id,
        displayName: userTable.displayName,
        name: userTable.name,
      },
    })
    .from(reviewAttempts)
    .innerJoin(userTable, eq(reviewAttempts.submittedById, userTable.id))
    .where(eq(reviewAttempts.activityId, activityId))
    .orderBy(desc(reviewAttempts.attemptNumber));

  return {
    ...act,
    owner: act.ownerId ? userMap.get(act.ownerId) || null : null,
    reviewer: act.reviewerId ? userMap.get(act.reviewerId) || null : null,
    creator: act.createdById ? userMap.get(act.createdById) || null : null,
    evidence,
    comments,
    history,
    attempts,
  };
}

/**
 * List activities with filters
 */
export async function listActivities({
  workspaceId,
  campaignId,
  channelId,
  status,
  socialPlatform,
  ownerId,
  reviewerId,
}: {
  workspaceId: string;
  campaignId?: string;
  channelId?: string;
  status?: ActivityStatus;
  socialPlatform?: SocialPlatform;
  ownerId?: string;
  reviewerId?: string;
}) {
  const conditions = [eq(activities.workspaceId, workspaceId)];

  if (campaignId) {
    conditions.push(eq(activities.campaignId, campaignId));
  }
  if (channelId) {
    conditions.push(eq(activities.channelId, channelId));
  }
  if (status) {
    conditions.push(eq(activities.status, status));
  }
  if (socialPlatform) {
    conditions.push(eq(activities.socialPlatform, socialPlatform));
  }
  if (ownerId) {
    conditions.push(eq(activities.ownerId, ownerId));
  }
  if (reviewerId) {
    conditions.push(eq(activities.reviewerId, reviewerId));
  }

  await ensureChannelsTable();

  try {
    const items = await db
      .select({
        id: activities.id,
        campaignId: activities.campaignId,
        channelId: activities.channelId,
        channelName: channels.name,
        title: activities.title,
        brief: activities.brief,
        socialPlatform: activities.socialPlatform,
        contentType: activities.contentType,
        scheduledAt: activities.scheduledAt,
        reviewDeadline: activities.reviewDeadline,
        ownerId: activities.ownerId,
        reviewerId: activities.reviewerId,
        status: activities.status,
        passCriteria: activities.passCriteria,
        createdAt: activities.createdAt,
        campaignName: campaigns.name,
        owner: {
          id: userTable.id,
          name: userTable.name,
          displayName: userTable.displayName,
          image: userTable.image,
          avatarUrl: userTable.avatarUrl,
        },
      })
      .from(activities)
      .leftJoin(campaigns, eq(activities.campaignId, campaigns.id))
      .leftJoin(channels, eq(activities.channelId, channels.id))
      .leftJoin(userTable, eq(activities.ownerId, userTable.id))
      .where(and(...conditions))
      .orderBy(desc(activities.createdAt));

    return items;
  } catch (err: any) {
    console.error("listActivities primary query failed, using graceful fallback:", err?.message);
    const fallbackItems = await db
      .select({
        id: activities.id,
        campaignId: activities.campaignId,
        channelId: sql<string | null>`null`.as("channel_id"),
        channelName: sql<string | null>`null`.as("channel_name"),
        title: activities.title,
        brief: activities.brief,
        socialPlatform: activities.socialPlatform,
        contentType: activities.contentType,
        scheduledAt: activities.scheduledAt,
        reviewDeadline: activities.reviewDeadline,
        ownerId: activities.ownerId,
        reviewerId: activities.reviewerId,
        status: activities.status,
        passCriteria: activities.passCriteria,
        createdAt: activities.createdAt,
        campaignName: campaigns.name,
        owner: {
          id: userTable.id,
          name: userTable.name,
          displayName: userTable.displayName,
          image: userTable.image,
          avatarUrl: userTable.avatarUrl,
        },
      })
      .from(activities)
      .leftJoin(campaigns, eq(activities.campaignId, campaigns.id))
      .leftJoin(userTable, eq(activities.ownerId, userTable.id))
      .where(and(...conditions))
      .orderBy(desc(activities.createdAt));

    return fallbackItems;
  }
}

export interface TransitionStatusInput {
  workspaceId: string;
  activityId: string;
  targetStatus:
    | "draft"
    | "scheduled"
    | "in_progress"
    | "awaiting_review"
    | "passed"
    | "failed"
    | "canceled";
  userId: string;
  reason?: string;
}

export async function transitionActivityStatus({
  workspaceId,
  activityId,
  targetStatus,
  userId,
  reason,
}: TransitionStatusInput) {
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error("Activity not found in this workspace.");
    }

    if (existing.status === targetStatus) {
      return { success: true, activity: existing };
    }

    // Update status
    const [updated] = await tx
      .update(activities)
      .set({
        status: targetStatus,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, activityId))
      .returning();

    // Insert append-only status history audit record
    await tx.insert(activityStatusHistory).values({
      id: crypto.randomUUID(),
      activityId,
      fromStatus: existing.status,
      toStatus: targetStatus,
      changedById: userId,
      reason:
        reason ||
        `Status transitioned from ${existing.status.replace("_", " ")} to ${targetStatus.replace("_", " ")}`,
    });

    return { success: true, activity: updated };
  });
}
