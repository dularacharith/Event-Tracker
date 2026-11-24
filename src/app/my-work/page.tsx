import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listActivities } from "@/lib/services/activities";
import { listCampaigns } from "@/lib/services/campaigns";
import { MyWorkClient } from "./MyWorkClient";

export default async function MyWorkPage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  // Fetch all activities in workspace to compute owned, reviews assigned, and overdue
  const allActivities = await listActivities({
    workspaceId: member.workspaceId,
  });

  const campaigns = await listCampaigns(member.workspaceId);

  return (
    <MyWorkClient
      currentUser={user}
      userRole={member.role}
      activities={allActivities}
      campaigns={campaigns}
    />
  );
}
