import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid push subscription object" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Save push subscription into profile metadata
    const { error } = await supabase
      .from("profiles")
      .update({
        push_subscription: subscription,
      } as any)
      .eq("id", auth.user.id);

    if (error) {
      console.error("Error saving push subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Push subscription saved" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Subscription failed" },
      { status: 500 }
    );
  }
}
