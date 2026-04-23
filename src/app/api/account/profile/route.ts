import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { username } = body as Record<string, unknown>;

  if (username !== undefined && username !== null) {
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Username must be a string" }, { status: 400 });
    }
    const trimmed = username.trim();
    if (trimmed.length > 32) {
      return NextResponse.json({ error: "Username must be 32 characters or fewer" }, { status: 400 });
    }
    // Basic sanitisation — alphanumeric, underscores, hyphens only
    if (trimmed && !/^[a-zA-Z0-9_\-. ]+$/.test(trimmed)) {
      return NextResponse.json({ error: "Username contains invalid characters" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed || null })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
