import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listActivities } from "@/lib/services/activities";
import { listCampaigns } from "@/lib/services/campaigns";
import { listChannels } from "@/lib/services/channels";
import { listWorkspaceMembers } from "@/lib/services/team";
import { ActivitiesClient } from "./ActivitiesClient";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const { new: openNewModal } = await searchParams;

  const campaigns = await listCampaigns(member.workspaceId);
  const channels = await listChannels(member.workspaceId);
  const activities = await listActivities({
    workspaceId: member.workspaceId,
  });
  const teammates = await listWorkspaceMembers(member.workspaceId);

  return (
    <ActivitiesClient
      currentUser={user}
      userRole={member.role}
      initialActivities={activities}
      campaigns={campaigns}
      channels={channels}
      teammates={teammates}
      initialOpenCreate={openNewModal === "true"}
    />
  );
}
