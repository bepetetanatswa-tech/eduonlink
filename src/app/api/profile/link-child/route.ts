/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const relationship = body?.relationship;
  if (!email) return NextResponse.json({ error: "Child email is required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: parentProfile } = await (admin.from("profiles") as any)
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!parentProfile || parentProfile.role !== "parent") {
    return NextResponse.json({ error: "Only parent accounts can link children" }, { status: 403 });
  }

  const { data: child } = await (admin.from("profiles") as any)
    .select("id, full_name, email")
    .eq("email", email)
    .eq("role", "student")
    .maybeSingle();

  if (!child) {
    return NextResponse.json(
      { error: "No student account found with that email. Ask them to register on Educonnect first." },
      { status: 404 }
    );
  }

  const { data: link, error } = await (admin.from("parent_children") as any)
    .upsert(
      { parent_id: parentProfile.id, child_id: child.id, relationship: relationship || "guardian", status: "confirmed" },
      { onConflict: "parent_id,child_id" }
    )
    .select("id, relationship, status, child:child_id(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ link });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get("id");
  if (!linkId) return NextResponse.json({ error: "Missing link id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: parentProfile } = await (admin.from("profiles") as any)
    .select("id").eq("user_id", user.id).single();

  if (!parentProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { error } = await (admin.from("parent_children") as any)
    .delete()
    .eq("id", linkId)
    .eq("parent_id", parentProfile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
