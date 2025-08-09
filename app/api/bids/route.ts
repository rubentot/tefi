import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  console.log("GET /api/bids called with params:", req.url);
  const { searchParams } = new URL(req.url);
  const realEstateId = searchParams.get("realEstateId") || "property1";

  let supabase;
  try {
    supabase = createServerClient();
    console.log("Supabase client initialized successfully");
  } catch (initError) {
    console.error("Failed to initialize Supabase client:", initError);
    return NextResponse.json(
      { error: "Failed to initialize Supabase client: " + (initError instanceof Error ? initError.message : String(initError)) },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("real_estate_id", realEstateId)
      .gte("expiration", new Date().toISOString());
    console.log("Supabase query executed", { realEstateId, dataLength: data?.length, error });

    if (error) throw error;

    return NextResponse.json({ bids: data });
  } catch (error) {
    console.error("Error in GET /api/bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  console.log("DELETE /api/bids called with id:", params.id);
  let supabase;
  try {
    supabase = createServerClient();
    console.log("Supabase client initialized successfully");
  } catch (initError) {
    console.error("Failed to initialize Supabase client:", initError);
    return NextResponse.json(
      { error: "Failed to initialize Supabase client: " + (initError instanceof Error ? initError.message : String(initError)) },
      { status: 500 }
    );
  }

  try {
    const { error } = await supabase
      .from("bids")
      .delete()
      .eq("id", params.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/bids:", error);
    return NextResponse.json(
      { error: "Failed to delete bid: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}