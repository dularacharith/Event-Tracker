import React from "react";
import { getCurrentAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const { user, member } = await getCurrentAuth();

  if (!user || !member || member.status !== "active") {
    redirect("/login");
  }

  return (
    <ProfileClient
      currentUser={user}
      userRole={member.role}
    />
  );
}
