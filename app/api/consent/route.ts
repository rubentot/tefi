import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, gdpr, psd2, dataSharing, timestamp } = await req.json();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { error } = await supabase.from("consents").insert([
    { user_id: userId, gdpr, psd2, data_sharing: dataSharing, timestamp }
  ]);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}