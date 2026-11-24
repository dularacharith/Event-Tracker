import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listWorkspaceMembers, listWorkspaceInvites } from "@/lib/services/team";
import { TeamClient } from "./TeamClient";

export default async function TeamPage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  const members = await listWorkspaceMembers(member.workspaceId);
  const invites = member.role === "admin"
    ? await listWorkspaceInvites(member.workspaceId)
    : [];

  return (
    <TeamClient
      currentUser={user}
      userRole={member.role}
      initialMembers={members}
      initialInvites={invites}
    />
  );
}
