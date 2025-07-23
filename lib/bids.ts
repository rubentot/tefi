import { supabaseClient } from "@/lib/supabase-client";
import { v4 as uuidv4 } from "uuid";

/** ✅ Add Bid (called by Bidder Dashboard) */
export async function addBid(
  userId: string,
  bidAmount: number,
  maxFinancingAmount: number,
  realEstateId: string
): Promise<string> {
  const referenceCode = uuidv4().split("-")[0].toUpperCase(); // Short unique code

  const { error } = await supabaseClient.from("bids").insert([
    {
      user_id: userId,
      bid_amount: bidAmount,
      max_financing_amount: maxFinancingAmount,
      reference_code: referenceCode,
      real_estate_id: realEstateId,
    },
  ]);

  if (error) throw error;
  return referenceCode;
}

/** ✅ Get All Bids (called by Broker Dashboard) */
export async function getAllBids(realEstateId: string) {
  const { data, error } = await supabaseClient
    .from("bids")
    .select(
      `
      id,
      user_id,
      bid_amount,
      max_financing_amount,
      reference_code,
      approved,
      profiles (
        name,
        email,
        phone
      )
    `
    )
    .eq("real_estate_id", realEstateId)
    .order("inserted_at", { ascending: false });

  if (error) throw error;

  return data.map((b: any) => {
    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
    return {
      id: b.id,
      userId: b.user_id,
      name: profile?.name || "Ukjent",
      email: profile?.email || "-",
      phone: profile?.phone || "-",
      bidAmount: b.bid_amount,
      maxFinancing: b.max_financing_amount,
      referenceCode: b.reference_code,
      approved: b.approved,
    };
  });
}

/** ✅ Verify Reference Code (Broker enters a code manually) */
export async function verifyReferenceCode(referenceCode: string) {
  const { data, error } = await supabaseClient
    .from("bids")
    .select(
      `
      bid_amount,
      max_financing_amount,
      approved,
      profiles (
        name,
        email,
        phone
      )
    `
    )
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error || !data) return { valid: false };

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

  return {
    valid: true,
    approved: data.approved,
    details: {
      name: profile?.name || "Ukjent",
      email: profile?.email || "-",
      phone: profile?.phone || "-",
    },
  };
}

/** ✅ Approve or Reject Bid (Broker action) */
export async function updateBidApproval(referenceCode: string, approved: boolean) {
  const { error } = await supabaseClient
    .from("bids")
    .update({ approved })
    .eq("reference_code", referenceCode);

  if (error) throw error;
  return true;
}
