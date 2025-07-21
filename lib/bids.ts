import { supabaseClient } from "@/lib/supabase-client";

export async function addBid(
  userId: string,
  amount: number,
  realEstateId: string,
  maxFinancing: number
) {
  const referenceCode = crypto.randomUUID().split("-")[0];
  const { error } = await supabaseClient.from("bids").insert([
    {
      user_id: userId,
      bid_amount: amount,
      reference_code: referenceCode,
      real_estate_id: realEstateId,
      max_financing_amount: maxFinancing, // NEW FIELD
    },
  ]);

  if (error) {
    console.error("Error adding bid:", error.message);
    throw error;
  }
  return referenceCode;
}


/** Verify a reference code */
export async function verifyReferenceCode(referenceCode: string) {
  const { data, error } = await supabaseClient
    .from("bids")
    .select("*")
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error || !data) {
    return { valid: false };
  }

  return {
    valid: true,
    approved: data.approved,
    details: {
      name: "Mock Name", // later you can join with profiles
      email: "mock@example.com",
      phone: "00000000",
      bankContact: "Mock Bank Contact",
    },
  };
}

/** Approve or reject a bid */
export async function updateBidApproval(referenceCode: string, approved: boolean) {
  const { error } = await supabaseClient
    .from("bids")
    .update({ approved })
    .eq("reference_code", referenceCode);

  if (error) throw error;
}

