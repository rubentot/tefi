// /app/api/log-consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabaseServer = createServerClient();
  const { userId, consentType } = await req.json();
  const { error } = await supabaseServer.from("consents").insert({
    user_id: userId,
    consent_type: consentType,
  });
  if (error) throw error;
  return NextResponse.json({ success: true });
}