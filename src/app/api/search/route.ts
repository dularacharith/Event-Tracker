import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { db } from "@/db";
import {
  activities,
  campaigns,
  channels,
  workspaceMembers,
  user as userTable,
} from "@/db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { ensureChannelsTable } from "@/lib/services/channels";

export const runtime = "nodejs";

interface SearchResultItem {
  id: string;
  type: "setting" | "activity" | "campaign" | "channel" | "member";
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, any>;
}

// System settings, navigation targets, and feature shortcuts
const SYSTEM_SETTINGS = [
  {
    id: "setting-timezone",
    type: "setting" as const,
    title: "Timezone & Clock Settings",
    subtitle: "Settings • Configure user timezone, UTC offset, and schedule time rendering",
    url: "/profile",
    keywords: ["timezone", "utc", "clock", "time", "gmt", "profile", "calendar"],
  },
  {
    id: "setting-profile",
    type: "setting" as const,
    title: "Profile & Job Title Settings",
    subtitle: "Settings • Update display name, email, avatar image, and job designation",
    url: "/profile",
    keywords: ["profile", "job title", "name", "avatar", "account", "display name", "email"],
  },
  {
    id: "setting-team",
    type: "setting" as const,
    title: "Team Permissions & Member Roles",
    subtitle: "Settings • Manage workspace admins, member permissions, and teammate access",
    url: "/team",
    keywords: ["team", "role", "admin", "member", "permissions", "access", "workspace", "security"],
  },
  {
    id: "setting-invite",
    type: "setting" as const,
    title: "Invite Teammate to Workspace",
    subtitle: "Actions • Create single-use, verified invite links for new teammates",
    url: "/team?invite=true",
    keywords: ["invite", "teammate", "add user", "create invite", "email invite", "link"],
  },
  {
    id: "setting-flow",
    type: "setting" as const,
    title: "Kanban Columns & Card Color Configuration",
    subtitle: "Settings • Customize board columns, colors, status bubbles, and transition rules",
    url: "/activities",
    keywords: ["flow", "kanban", "columns", "color", "accent", "bubble", "customize", "cards", "board"],
  },
  {
    id: "setting-activities",
    type: "setting" as const,
    title: "Activities & Workflow Pipeline",
    subtitle: "Navigation • Kanban board, review chains, scheduled posts, and task tracking",
    url: "/activities",
    keywords: ["activities", "board", "tasks", "pipeline", "scheduled", "draft", "in progress", "review"],
  },
  {
    id: "setting-calendar",
    type: "setting" as const,
    title: "Calendar & Schedule View",
    subtitle: "Navigation • Monthly and weekly publication timeline and review deadlines",
    url: "/calendar",
    keywords: ["calendar", "schedule", "deadlines", "due date", "month", "week", "planner"],
  },
  {
    id: "setting-campaigns",
    type: "setting" as const,
    title: "Campaigns Management",
    subtitle: "Navigation • Overview of active social media campaigns, roadmaps, and goals",
    url: "/campaigns",
    keywords: ["campaigns", "marketing", "road to 100k", "goals", "initiatives"],
  },
  {
    id: "setting-channels",
    type: "setting" as const,
    title: "Channels & Social Accounts Hub",
    subtitle: "Navigation • Connect and organize Twitter, Instagram, TikTok, and YouTube channels",
    url: "/channels",
    keywords: ["channels", "social media", "accounts", "twitter", "instagram", "tiktok", "youtube", "linkedin", "facebook", "threads"],
  },
  {
    id: "setting-my-work",
    type: "setting" as const,
    title: "My Work & Pending Reviews",
    subtitle: "Navigation • Personal assignments, tasks needing evidence, and reviewer verdicts",
    url: "/my-work",
    keywords: ["my work", "assigned", "tasks", "pending", "todo", "reviewer", "evidence"],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { user, member } = await getCurrentAuth(req.headers);
    if (!user || !member || member.status !== "active") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

    // 1. Match system settings & navigation
    let matchedSettings: SearchResultItem[] = [];
    if (q) {
      matchedSettings = SYSTEM_SETTINGS.filter((item) => {
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.subtitle.toLowerCase().includes(q)) return true;
        return item.keywords.some((k) => k.includes(q) || q.includes(k));
      }).map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        url: s.url,
      }));
    } else {
      // Return top quick settings if query is empty
      matchedSettings = SYSTEM_SETTINGS.slice(0, 4).map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        url: s.url,
      }));
    }

    if (!q) {
      return NextResponse.json({
        success: true,
        results: {
          settings: matchedSettings,
          activities: [],
          campaigns: [],
          channels: [],
          members: [],
        },
      });
    }

    const searchPattern = `%${q}%`;

    // 2. Search activities
    const actRows = await db
      .select({
        id: activities.id,
        title: activities.title,
        brief: activities.brief,
        status: activities.status,
        socialPlatform: activities.socialPlatform,
        contentType: activities.contentType,
        campaignName: campaigns.name,
      })
      .from(activities)
      .leftJoin(campaigns, eq(activities.campaignId, campaigns.id))
      .where(
        and(
          eq(activities.workspaceId, member.workspaceId),
          or(
            ilike(activities.title, searchPattern),
            ilike(activities.brief, searchPattern),
            ilike(activities.passCriteria, searchPattern),
            ilike(activities.socialPlatform, searchPattern),
            ilike(activities.status, searchPattern)
          )
        )
      )
      .limit(8);

    const matchedActivities: SearchResultItem[] = actRows.map((act) => ({
      id: act.id,
      type: "activity",
      title: act.title,
      subtitle: `${act.campaignName || "Campaign"} • ${act.socialPlatform.toUpperCase()} • ${act.status.replace("_", " ").toUpperCase()}`,
      url: `/activities/${act.id}`,
      meta: {
        status: act.status,
        socialPlatform: act.socialPlatform,
        contentType: act.contentType,
      },
    }));

    // 3. Search campaigns
    const campRows = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, member.workspaceId),
          or(
            ilike(campaigns.name, searchPattern),
            ilike(campaigns.description, searchPattern)
          )
        )
      )
      .limit(5);

    const matchedCampaigns: SearchResultItem[] = campRows.map((c) => ({
      id: c.id,
      type: "campaign",
      title: c.name,
      subtitle: c.description || `Campaign • ${c.status}`,
      url: `/campaigns`,
      meta: { status: c.status },
    }));

    // 4. Search channels
    await ensureChannelsTable();
    let matchedChannels: SearchResultItem[] = [];
    try {
      const chRows = await db
        .select({
          id: channels.id,
          name: channels.name,
          platform: channels.platform,
          description: channels.description,
        })
        .from(channels)
        .where(
          and(
            eq(channels.workspaceId, member.workspaceId),
            or(
              ilike(channels.name, searchPattern),
              ilike(channels.platform, searchPattern),
              ilike(channels.description, searchPattern)
            )
          )
        )
        .limit(5);

      matchedChannels = chRows.map((ch) => ({
        id: ch.id,
        type: "channel",
        title: `#${ch.name}`,
        subtitle: `${(ch.platform || "Social").toUpperCase()} Channel ${ch.description ? `• ${ch.description}` : ""}`,
        url: `/channels`,
        meta: { platform: ch.platform },
      }));
    } catch (err) {
      // fallback if table is not yet accessible
    }

    // 5. Search team members
    const memberRows = await db
      .select({
        userId: userTable.id,
        name: userTable.name,
        displayName: userTable.displayName,
        email: userTable.email,
        jobTitle: userTable.jobTitle,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(userTable, eq(workspaceMembers.userId, userTable.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, member.workspaceId),
          eq(workspaceMembers.status, "active"),
          or(
            ilike(userTable.name, searchPattern),
            ilike(userTable.displayName, searchPattern),
            ilike(userTable.email, searchPattern),
            ilike(userTable.jobTitle, searchPattern)
          )
        )
      )
      .limit(5);

    const matchedMembers: SearchResultItem[] = memberRows.map((m) => ({
      id: m.userId,
      type: "member",
      title: m.displayName || m.name,
      subtitle: `${m.email} • ${m.role.toUpperCase()}${m.jobTitle ? ` • ${m.jobTitle}` : ""}`,
      url: `/team`,
      meta: { role: m.role, jobTitle: m.jobTitle },
    }));

    return NextResponse.json({
      success: true,
      results: {
        settings: matchedSettings,
        activities: matchedActivities,
        campaigns: matchedCampaigns,
        channels: matchedChannels,
        members: matchedMembers,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
