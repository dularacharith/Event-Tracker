import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/session";

export default async function HomePage() {
  const { user, member } = await getCurrentAuth();

  if (user && member && member.status === "active") {
    redirect("/my-work");
  }

  if (user && (!member || member.status !== "active")) {
    redirect("/unauthorized");
  }

  redirect("/login");
}
