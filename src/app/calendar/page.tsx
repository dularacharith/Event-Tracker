import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listActivities } from "@/lib/services/activities";
import { listCampaigns } from "@/lib/services/campaigns";
import { listWorkspaceMembers } from "@/lib/services/team";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const activities = await listActivities({
    workspaceId: member.workspaceId,
  });

  const campaigns = await listCampaigns(member.workspaceId);
  const teammates = await listWorkspaceMembers(member.workspaceId);

  return (
    <CalendarClient
      currentUser={user}
      userRole={member.role}
      activities={activities}
      campaigns={campaigns}
      teammates={teammates}
    />
  );
}
