import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { getActivityDetails } from "@/lib/services/activities";
import { listWorkspaceMembers } from "@/lib/services/team";
import { ActivityDetailClient } from "./ActivityDetailClient";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const { id } = await params;
  const activity = await getActivityDetails(member.workspaceId, id);

  if (!activity) {
    notFound();
  }

  const teammates = await listWorkspaceMembers(member.workspaceId);

  return (
    <ActivityDetailClient
      currentUser={user}
      userRole={member.role}
      activity={activity}
      teammates={teammates}
    />
  );
}
