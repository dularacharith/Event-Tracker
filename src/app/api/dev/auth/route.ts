import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bootstrapFirstAdminIfNeeded } from "@/lib/session";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  try {
    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    let u = existingUser[0];
    if (!u) {
      const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const [created] = await db
        .insert(userTable)
        .values({
          id,
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          displayName: name || normalizedEmail.split("@")[0],
          emailVerified: true,
          timezone: "UTC",
        })
        .returning();
      u = created;
    }

    // Check if initial admin bootstrap applies
    await bootstrapFirstAdminIfNeeded(u);

    // Set cookie for dev environment testing
    const cookieStore = await cookies();
    cookieStore.set("cf_dev_user_id", u.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, user: u });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
