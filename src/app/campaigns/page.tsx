import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listCampaigns } from "@/lib/services/campaigns";
import { CampaignsClient } from "./CampaignsClient";

export default async function CampaignsPage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const campaigns = await listCampaigns(member.workspaceId);

  return (
    <CampaignsClient
      currentUser={user}
      userRole={member.role}
      initialCampaigns={campaigns}
    />
  );
}
