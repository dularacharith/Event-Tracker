import { describe, it, expect, beforeEach } from "vitest";
import { setupTestDatabase } from "./setup";
import { user as userTable, workspaceMembers, workspaces, campaigns } from "@/db/schema";
import {
  bootstrapFirstAdminIfNeeded,
  getOrCreateSharedWorkspace,
  requireActiveMember,
} from "@/lib/session";
import {
  createInvite,
  acceptInvite,
  revokeInvite,
  getInviteStatus,
} from "@/lib/services/team";
import {
  createActivity,
  scheduleActivity,
  startProgress,
  submitForReview,
  recordReviewVerdict,
  rescheduleActivity,
  reassignReviewer,
  addEvidence,
  getActivityDetails,
} from "@/lib/services/activities";
import { validateImageBuffer } from "@/lib/storage";

describe("CampaignFlow Core Workflow & Security Suite", () => {
  let db: any;

  beforeEach(async () => {
    const context = await setupTestDatabase();
    db = context.testDb;
    process.env.FIRST_ADMIN_EMAIL = "admin@company.com";
  });

  describe("1. Workspace, First Admin Bootstrap & Invite-only Access Control", () => {
    it("configures the first admin once using matching verified Google sign-in and configured email", async () => {
      const workspace = await getOrCreateSharedWorkspace();
      expect(workspace.slug).toBe("default");

      // User with configured admin email logs in
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice Admin",
          displayName: "Alice Admin",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();

      const member = await bootstrapFirstAdminIfNeeded(adminUser);
      expect(member).not.toBeNull();
      expect(member?.role).toBe("admin");
      expect(member?.status).toBe("active");

      // Verify that subsequent visits do not duplicate or alter admin membership
      const secondCheck = await bootstrapFirstAdminIfNeeded(adminUser);
      expect(secondCheck?.role).toBe("admin");
    });

    it("rejects automatic access for uninvited Google sign-ins", async () => {
      // First admin already exists
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice Admin",
          displayName: "Alice Admin",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(adminUser);

      // Random visitor signs in with Google
      const [visitor] = await db
        .insert(userTable)
        .values({
          id: "u-stranger",
          email: "stranger@external.com",
          name: "Stranger",
          displayName: "Stranger",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();

      // Bootstrap check should return null
      const visitorMember = await bootstrapFirstAdminIfNeeded(visitor);
      expect(visitorMember).toBeNull();

      // Member check should fail with FORBIDDEN_NOT_A_MEMBER
      const headers = new Headers();
      headers.set("x-test-user-id", visitor.id);
      await expect(requireActiveMember(headers)).rejects.toThrow(
        "FORBIDDEN_NOT_A_MEMBER"
      );
    });

    it("admin can invite a teammate, who accepts with matching email", async () => {
      const workspace = await getOrCreateSharedWorkspace();
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice Admin",
          displayName: "Alice Admin",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(adminUser);

      // Admin invites teammate
      const invite = await createInvite({
        workspaceId: workspace.id,
        invitedById: adminUser.id,
        email: "bob@company.com",
        role: "member",
        expiresInDays: 7,
      });

      expect(invite.token).toBeDefined();
      expect(invite.email).toBe("bob@company.com");

      // Bob signs in with Google
      const [bobUser] = await db
        .insert(userTable)
        .values({
          id: "u-bob",
          email: "bob@company.com",
          name: "Bob Teammate",
          displayName: "Bob Teammate",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();

      // Bob accepts invite
      const accepted = await acceptInvite({
        token: invite.token,
        user: bobUser,
      });

      expect(accepted.success).toBe(true);
      expect(accepted.member.role).toBe("member");
      expect(accepted.member.status).toBe("active");

      // Verify status is now already_used
      const inviteCheck = await getInviteStatus(invite.token);
      expect(inviteCheck.status).toBe("already_used");
    });

    it("blocks wrong-email users from accepting an invite", async () => {
      const workspace = await getOrCreateSharedWorkspace();
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice Admin",
          emailVerified: true,
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(adminUser);

      const invite = await createInvite({
        workspaceId: workspace.id,
        invitedById: adminUser.id,
        email: "bob@company.com",
      });

      // Different user signs in
      const [charlieUser] = await db
        .insert(userTable)
        .values({
          id: "u-charlie",
          email: "charlie@other.com",
          name: "Charlie",
          emailVerified: true,
        })
        .returning();

      await expect(
        acceptInvite({
          token: invite.token,
          user: charlieUser,
        })
      ).rejects.toThrow("This invite was created for bob@company.com");
    });

    it("blocks reuse of already accepted invites", async () => {
      const workspace = await getOrCreateSharedWorkspace();
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice",
          emailVerified: true,
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(adminUser);

      const invite = await createInvite({
        workspaceId: workspace.id,
        invitedById: adminUser.id,
        email: "bob@company.com",
      });

      const [bobUser] = await db
        .insert(userTable)
        .values({
          id: "u-bob",
          email: "bob@company.com",
          name: "Bob",
          emailVerified: true,
        })
        .returning();

      await acceptInvite({ token: invite.token, user: bobUser });

      // Second attempt to use same invite
      await expect(
        acceptInvite({ token: invite.token, user: bobUser })
      ).rejects.toThrow("This invite has already been accepted");
    });

    it("blocks revoked invites", async () => {
      const workspace = await getOrCreateSharedWorkspace();
      const [adminUser] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Alice",
          emailVerified: true,
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(adminUser);

      const invite = await createInvite({
        workspaceId: workspace.id,
        invitedById: adminUser.id,
        email: "bob@company.com",
      });

      // Admin revokes invite
      await revokeInvite({
        workspaceId: workspace.id,
        inviteId: invite.id,
      });

      const [bobUser] = await db
        .insert(userTable)
        .values({
          id: "u-bob",
          email: "bob@company.com",
          name: "Bob",
          emailVerified: true,
        })
        .returning();

      await expect(
        acceptInvite({ token: invite.token, user: bobUser })
      ).rejects.toThrow("This invite has been revoked by an administrator.");
    });
  });

  describe("2. Scheduling & Review Workflow", () => {
    let workspace: any;
    let admin: any;
    let teammateA: any;
    let teammateB: any;
    let campaign: any;

    beforeEach(async () => {
      workspace = await getOrCreateSharedWorkspace();

      // Admin
      [admin] = await db
        .insert(userTable)
        .values({
          id: "u-admin",
          email: "admin@company.com",
          name: "Admin Alice",
          displayName: "Alice",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      await bootstrapFirstAdminIfNeeded(admin);

      // Teammate A (Owner)
      [teammateA] = await db
        .insert(userTable)
        .values({
          id: "u-team-a",
          email: "teammatea@company.com",
          name: "Teammate A",
          displayName: "Teammate A",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      await db.insert(workspaceMembers).values({
        id: "wm-a",
        workspaceId: workspace.id,
        userId: teammateA.id,
        role: "member",
        status: "active",
      });

      // Teammate B (Reviewer)
      [teammateB] = await db
        .insert(userTable)
        .values({
          id: "u-team-b",
          email: "teammateb@company.com",
          name: "Teammate B",
          displayName: "Teammate B",
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      await db.insert(workspaceMembers).values({
        id: "wm-b",
        workspaceId: workspace.id,
        userId: teammateB.id,
        role: "member",
        status: "active",
      });

      // Campaign
      const [camp] = await db
        .insert(campaigns)
        .values({
          id: "camp-q1",
          workspaceId: workspace.id,
          name: "Q1 Brand Campaign",
          createdById: admin.id,
        })
        .returning();
      campaign = camp;
    });

    it("enforces scheduling rules: owner, eligible reviewer, criteria, deadline > scheduled time", async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const invalidDeadline = new Date(scheduledAt.getTime() - 60 * 60 * 1000); // BEFORE scheduled time!
      const validDeadline = new Date(scheduledAt.getTime() + 60 * 60 * 1000); // AFTER scheduled time

      // 1. Rejects if review deadline is before/at scheduled time
      await expect(
        createActivity({
          workspaceId: workspace.id,
          campaignId: campaign.id,
          title: "Product Launch Video",
          brief: "Video announcing new feature",
          socialPlatform: "youtube",
          contentType: "reel_video",
          scheduledAt,
          reviewDeadline: invalidDeadline,
          ownerId: teammateA.id,
          reviewerId: teammateB.id,
          passCriteria: "Must have 4K export and captions",
          createdById: admin.id,
          initialStatus: "scheduled",
        })
      ).rejects.toThrow("Review deadline must be strictly after the scheduled time.");

      // 2. Rejects self-review (reviewer === owner)
      await expect(
        createActivity({
          workspaceId: workspace.id,
          campaignId: campaign.id,
          title: "Self Review Attempt",
          brief: "Brief",
          socialPlatform: "twitter",
          contentType: "post",
          scheduledAt,
          reviewDeadline: validDeadline,
          ownerId: teammateA.id,
          reviewerId: teammateA.id, // SAME!
          passCriteria: "Looks good",
          createdById: admin.id,
          initialStatus: "scheduled",
        })
      ).rejects.toThrow("The reviewer cannot be the owner");

      // 3. Rejects if pass criteria is missing
      await expect(
        createActivity({
          workspaceId: workspace.id,
          campaignId: campaign.id,
          title: "No Criteria",
          brief: "Brief",
          socialPlatform: "twitter",
          contentType: "post",
          scheduledAt,
          reviewDeadline: validDeadline,
          ownerId: teammateA.id,
          reviewerId: teammateB.id,
          passCriteria: "",
          createdById: admin.id,
          initialStatus: "scheduled",
        })
      ).rejects.toThrow("pass criteria must be specified");

      // 4. Successfully creates scheduled activity when all constraints are met
      const scheduledAct = await createActivity({
        workspaceId: workspace.id,
        campaignId: campaign.id,
        title: "Valid Scheduled Activity",
        brief: "Valid brief",
        socialPlatform: "linkedin",
        contentType: "post",
        scheduledAt,
        reviewDeadline: validDeadline,
        ownerId: teammateA.id,
        reviewerId: teammateB.id,
        passCriteria: "Grammar checked and approved hashtag list",
        createdById: admin.id,
        initialStatus: "scheduled",
      });

      expect(scheduledAct.status).toBe("scheduled");
      expect(scheduledAct.ownerId).toBe(teammateA.id);
      expect(scheduledAct.reviewerId).toBe(teammateB.id);
    });

    it("executes the complete workflow: submit evidence -> reviewer verdict -> history inspection", async () => {
      const scheduledAt = new Date(Date.now() + 10000);
      const reviewDeadline = new Date(Date.now() + 20000);

      // Create scheduled activity
      const activity = await createActivity({
        workspaceId: workspace.id,
        campaignId: campaign.id,
        title: "Instagram Carousel",
        brief: "5-slide carousel on product tips",
        socialPlatform: "instagram",
        contentType: "carousel",
        scheduledAt,
        reviewDeadline,
        ownerId: teammateA.id,
        reviewerId: teammateB.id,
        passCriteria: "All 5 slides have correct brand hex codes and no typos",
        createdById: admin.id,
        initialStatus: "scheduled",
      });

      // Advance to in_progress
      await startProgress({
        workspaceId: workspace.id,
        activityId: activity.id,
        userId: teammateA.id,
      });

      // Submitting without evidence must be rejected
      await expect(
        submitForReview({
          workspaceId: workspace.id,
          activityId: activity.id,
          ownerId: teammateA.id,
        })
      ).rejects.toThrow("At least one piece of evidence");

      // Owner attaches external link evidence
      const evidence = await addEvidence({
        activityId: activity.id,
        userId: teammateA.id,
        type: "external_link",
        externalUrl: "https://figma.com/design/test-carousel",
        caption: "Figma design ready for review",
      });
      expect(evidence.id).toBeDefined();

      // Non-owner cannot submit for review
      await expect(
        submitForReview({
          workspaceId: workspace.id,
          activityId: activity.id,
          ownerId: teammateB.id, // Reviewer trying to submit
        })
      ).rejects.toThrow("Only the assigned owner can submit");

      // Owner submits for review
      const submitted = await submitForReview({
        workspaceId: workspace.id,
        activityId: activity.id,
        ownerId: teammateA.id,
      });
      expect(submitted.status).toBe("awaiting_review");
      expect(submitted.currentAttemptNumber).toBe(1);

      // Rule: Unassigned reviewer or Admin cannot record verdict
      await expect(
        recordReviewVerdict({
          workspaceId: workspace.id,
          activityId: activity.id,
          reviewerId: admin.id, // Admin is not assigned reviewer!
          verdict: "passed",
          verdictReason: "Admin override attempt",
        })
      ).rejects.toThrow("Only the assigned reviewer can record a verdict");

      // Rule: Verdict requires written reason
      await expect(
        recordReviewVerdict({
          workspaceId: workspace.id,
          activityId: activity.id,
          reviewerId: teammateB.id,
          verdict: "passed",
          verdictReason: "   ", // Empty reason
        })
      ).rejects.toThrow("A written reason is required");

      // Assigned reviewer records verdict 'passed'
      const passedAct = await recordReviewVerdict({
        workspaceId: workspace.id,
        activityId: activity.id,
        reviewerId: teammateB.id,
        verdict: "passed",
        verdictReason: "All 5 slides verified against brand hex codes and copy is clean.",
      });

      expect(passedAct.status).toBe("passed");

      // Both can see the details and history
      const details = await getActivityDetails(workspace.id, activity.id);
      expect(details?.status).toBe("passed");
      expect(details?.history.length).toBeGreaterThanOrEqual(4);
      expect(details?.attempts.length).toBe(1);
      expect(details?.attempts[0].verdict).toBe("passed");
      expect(details?.attempts[0].criteriaSnapshot).toBe(
        "All 5 slides have correct brand hex codes and no typos"
      );
      expect(details?.attempts[0].evidenceSnapshot).toContain("figma.com");
    });

    it("rescheduling failed work preserves past verdict, reason, and criteria/evidence snapshot", async () => {
      const scheduledAt = new Date(Date.now() + 10000);
      const reviewDeadline = new Date(Date.now() + 20000);

      const activity = await createActivity({
        workspaceId: workspace.id,
        campaignId: campaign.id,
        title: "Twitter Thread",
        brief: "Thread on industry news",
        socialPlatform: "twitter",
        contentType: "thread",
        scheduledAt,
        reviewDeadline,
        ownerId: teammateA.id,
        reviewerId: teammateB.id,
        passCriteria: "Original criteria v1",
        createdById: admin.id,
        initialStatus: "scheduled",
      });

      await startProgress({
        workspaceId: workspace.id,
        activityId: activity.id,
        userId: teammateA.id,
      });

      await addEvidence({
        activityId: activity.id,
        userId: teammateA.id,
        type: "external_link",
        externalUrl: "https://docs.google.com/draft-thread-1",
        caption: "Draft v1",
      });

      await submitForReview({
        workspaceId: workspace.id,
        activityId: activity.id,
        ownerId: teammateA.id,
      });

      // Teammate B marks Failed with reason
      await recordReviewVerdict({
        workspaceId: workspace.id,
        activityId: activity.id,
        reviewerId: teammateB.id,
        verdict: "failed",
        verdictReason: "Tweet #3 contains incorrect data source. Please verify and revise.",
      });

      // Owner or Admin reschedules failed work
      const newScheduledAt = new Date(Date.now() + 30000);
      const newReviewDeadline = new Date(Date.now() + 40000);

      const rescheduled = await rescheduleActivity({
        workspaceId: workspace.id,
        activityId: activity.id,
        userId: teammateA.id,
        userRole: "member",
        scheduledAt: newScheduledAt,
        reviewDeadline: newReviewDeadline,
        passCriteria: "Updated criteria: check corrected data source in tweet #3",
        rescheduleReason: "Correcting tweet #3 with official report numbers",
      });

      expect(rescheduled.status).toBe("scheduled");

      // Verify Attempt #1 snapshot remains completely intact!
      const details = await getActivityDetails(workspace.id, activity.id);
      expect(details?.attempts.length).toBe(1);
      expect(details?.attempts[0].attemptNumber).toBe(1);
      expect(details?.attempts[0].verdict).toBe("failed");
      expect(details?.attempts[0].verdictReason).toContain("incorrect data source");
      expect(details?.attempts[0].criteriaSnapshot).toBe("Original criteria v1");

      // Now owner submits Attempt #2
      await startProgress({
        workspaceId: workspace.id,
        activityId: activity.id,
        userId: teammateA.id,
      });

      await addEvidence({
        activityId: activity.id,
        userId: teammateA.id,
        type: "external_link",
        externalUrl: "https://docs.google.com/draft-thread-2-revised",
        caption: "Draft v2 with corrected source",
      });

      await submitForReview({
        workspaceId: workspace.id,
        activityId: activity.id,
        ownerId: teammateA.id,
      });

      // Now reviewer passes Attempt #2
      await recordReviewVerdict({
        workspaceId: workspace.id,
        activityId: activity.id,
        reviewerId: teammateB.id,
        verdict: "passed",
        verdictReason: "Data source verified and approved.",
      });

      // Verify both attempts exist with separate snapshots!
      const finalDetails = await getActivityDetails(workspace.id, activity.id);
      expect(finalDetails?.attempts.length).toBe(2);
      expect(finalDetails?.attempts[0].attemptNumber).toBe(2);
      expect(finalDetails?.attempts[0].verdict).toBe("passed");
      expect(finalDetails?.attempts[1].attemptNumber).toBe(1);
      expect(finalDetails?.attempts[1].verdict).toBe("failed");
    });

    it("rejects duplicate or stale decisions on the same review attempt", async () => {
      const scheduledAt = new Date(Date.now() + 10000);
      const reviewDeadline = new Date(Date.now() + 20000);

      const activity = await createActivity({
        workspaceId: workspace.id,
        campaignId: campaign.id,
        title: "TikTok Clip",
        brief: "Quick hook",
        socialPlatform: "tiktok",
        contentType: "reel_video",
        scheduledAt,
        reviewDeadline,
        ownerId: teammateA.id,
        reviewerId: teammateB.id,
        passCriteria: "Sound on",
        createdById: admin.id,
        initialStatus: "scheduled",
      });

      await addEvidence({
        activityId: activity.id,
        userId: teammateA.id,
        type: "external_link",
        externalUrl: "https://tiktok.com/@test",
      });

      await submitForReview({
        workspaceId: workspace.id,
        activityId: activity.id,
        ownerId: teammateA.id,
      });

      // First decision succeeds
      await recordReviewVerdict({
        workspaceId: workspace.id,
        activityId: activity.id,
        reviewerId: teammateB.id,
        verdict: "passed",
        verdictReason: "Approved",
      });

      // Second simultaneous / stale decision is rejected
      await expect(
        recordReviewVerdict({
          workspaceId: workspace.id,
          activityId: activity.id,
          reviewerId: teammateB.id,
          verdict: "failed",
          verdictReason: "Late contradictory verdict",
        })
      ).rejects.toThrow("This activity is not currently awaiting review");
    });
  });

  describe("3. File Validation & Private Storage Access Control", () => {
    it("validates file size up to 3MB and allowed MIME types", () => {
      // 1. Rejects file > 3MB
      const hugeBuffer = Buffer.alloc(3 * 1024 * 1024 + 1);
      const sizeValidation = validateImageBuffer(hugeBuffer, "image/png");
      expect(sizeValidation.valid).toBe(false);
      expect(sizeValidation.error).toContain("3 MB limit");

      // 2. Rejects unsupported MIME types (e.g. video/mp4, application/pdf)
      const mp4Buffer = Buffer.alloc(100);
      const mimeValidation = validateImageBuffer(mp4Buffer, "video/mp4");
      expect(mimeValidation.valid).toBe(false);
      expect(mimeValidation.error).toContain("Only PNG, JPEG, and WebP");

      // 3. Validates authentic PNG header
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      const validPng = validateImageBuffer(pngBuffer, "image/png");
      expect(validPng.valid).toBe(true);

      // 4. Validates authentic JPEG header
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const validJpeg = validateImageBuffer(jpegBuffer, "image/jpeg");
      expect(validJpeg.valid).toBe(true);
    });
  });
});
