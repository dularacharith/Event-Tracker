import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Better Auth core tables
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  displayName: text("display_name"),
  jobTitle: text("job_title"),
  timezone: text("timezone").default("UTC").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Workspace & Membership tables
// ---------------------------------------------------------------------------
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] })
    .default("member")
    .notNull(),
  status: text("status", { enum: ["active", "deactivated"] })
    .default("active")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(), // normalized lowercased
  role: text("role", { enum: ["admin", "member"] })
    .default("member")
    .notNull(),
  token: text("token").notNull().unique(),
  invitedById: text("invited_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedById: text("accepted_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Campaigns & Activities
// ---------------------------------------------------------------------------
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status")
    .default("active")
    .notNull(),
  color: text("color"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Channels (Optional publication channels e.g. @BrandAccount, YouTube Main)
// ---------------------------------------------------------------------------
export const channels = pgTable("channels", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  platform: text("platform"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  channelId: text("channel_id").references(() => channels.id, {
    onDelete: "set null",
  }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  socialPlatform: text("social_platform", {
    enum: [
      "twitter",
      "instagram",
      "linkedin",
      "tiktok",
      "youtube",
      "facebook",
      "threads",
    ],
  }).notNull(),
  contentType: text("content_type", {
    enum: [
      "post",
      "reel",
      "video",
      "reel_video",
      "story",
      "thread",
      "carousel",
      "article",
    ],
  }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  reviewDeadline: timestamp("review_deadline", { withTimezone: true }),
  recurrenceRule: text("recurrence_rule"),
  recurrenceDay: text("recurrence_day"),
  recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true }),
  parentActivityId: text("parent_activity_id"),
  ownerId: text("owner_id").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewerId: text("reviewer_id").references(() => user.id, {
    onDelete: "set null",
  }),
  passCriteria: text("pass_criteria").default("").notNull(),
  status: text("status", {
    enum: [
      "draft",
      "scheduled",
      "in_progress",
      "awaiting_review",
      "passed",
      "failed",
      "canceled",
    ],
  })
    .default("draft")
    .notNull(),
  currentAttemptNumber: integer("current_attempt_number").default(0).notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Media & Private Files
// ---------------------------------------------------------------------------
export const mediaFiles = pgTable("media_files", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  uploadedById: text("uploaded_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  blobUrl: text("blob_url").notNull(), // private blob pathname / url
  purpose: text("purpose", { enum: ["avatar", "evidence"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Evidence (Screenshots via private blob or external links)
// ---------------------------------------------------------------------------
export const activityEvidence = pgTable("activity_evidence", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["screenshot", "external_link"] }).notNull(),
  mediaFileId: text("media_file_id").references(() => mediaFiles.id, {
    onDelete: "set null",
  }),
  externalUrl: text("external_url"),
  caption: text("caption"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Review Attempts (Snapshots criteria and evidence per submission attempt)
// ---------------------------------------------------------------------------
export const reviewAttempts = pgTable("review_attempts", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull(),
  submittedById: text("submitted_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  criteriaSnapshot: text("criteria_snapshot").notNull(),
  evidenceSnapshot: text("evidence_snapshot").notNull(), // JSON string of evidence list
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verdict: text("verdict", { enum: ["passed", "failed"] }),
  verdictReason: text("verdict_reason"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedById: text("decided_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Activity Status History (Append-only audit trail)
// ---------------------------------------------------------------------------
export const activityStatusHistory = pgTable("activity_status_history", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  changedById: text("changed_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  reason: text("reason"),
  metadata: text("metadata"), // JSON string with extra details if needed
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Activity Comments
// ---------------------------------------------------------------------------
export const activityComments = pgTable("activity_comments", {
  id: text("id").primaryKey(),
  activityId: text("activity_id")
    .notNull()
    .references(() => activities.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------------------------------------------------------------------------
// Notifications (In-app notices)
// ---------------------------------------------------------------------------
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => user.id, {
    onDelete: "set null",
  }),
  activityId: text("activity_id").references(() => activities.id, {
    onDelete: "cascade",
  }),
  type: text("type", {
    enum: ["review_requested", "review_decided", "reviewer_assigned"],
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
