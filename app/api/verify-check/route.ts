import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  // Mock: Valid if code is non-empty (real: check DB/expiration)
  if (code) return NextResponse.json({ success: true });
  return NextResponse.json({ error: "Invalid code" });
}