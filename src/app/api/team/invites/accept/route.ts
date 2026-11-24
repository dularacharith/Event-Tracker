import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/session";
import { acceptInvite } from "@/lib/services/team";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentAuth(req.headers);
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in with Google to accept an invite." },
        { status: 401 }
      );
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    }

    const result = await acceptInvite({
      token,
      user,
    });

    return NextResponse.json({ success: true, member: result.member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
