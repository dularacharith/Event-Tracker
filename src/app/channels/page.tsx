import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listChannels } from "@/lib/services/channels";
import { ChannelsClient } from "./ChannelsClient";

export default async function ChannelsPage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const channels = await listChannels(member.workspaceId);

  return (
    <ChannelsClient
      currentUser={user}
      userRole={member.role}
      initialChannels={channels}
    />
  );
}
