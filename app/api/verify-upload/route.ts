import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import pdfParse from "pdf-parse";
import { supabaseClient } from "@/lib/supabase-client";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const expectedName = formData.get("expectedName") as string;
    const bidAmount = parseFloat(formData.get("bidAmount") as string);
    const userId = formData.get("userId") as string;
    const propertyId = formData.get("propertyId") as string || "unknown_property";

    if (!file || !expectedName || !bidAmount || !userId || !propertyId) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    // Save temp file (needed for tesseract/pdf-parse)
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join("/tmp", `upload-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, file.name);
    fs.writeFileSync(filePath, buffer);

    let textContent = "";

    if (file.name.endsWith(".pdf")) {
      // ✅ Extract text from PDF
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
    } else {
      // ✅ OCR for images
      const ocrResult = await Tesseract.recognize(filePath, "nor"); // Norwegian OCR
      textContent = ocrResult.data.text;
    }

    // ✅ Extract financing amount (look for something like "1 500 000" or "1500000")
    const amountMatch = textContent.match(/(\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?)/g);
    const detectedAmounts = amountMatch
      ?.map((a) => parseInt(a.replace(/[^\d]/g, ""), 10))
      .filter((n) => n > 50000); // filter plausible amounts

    const maxFinancing = detectedAmounts ? Math.max(...detectedAmounts) : 0;

    // ✅ Extract name (very naive: just check if expectedName is in text)
    const detectedName = textContent.includes(expectedName)
      ? expectedName
      : textContent.split("\n").find((line) => line.toLowerCase().includes(expectedName.toLowerCase())) || "Ukjent";

    // ✅ Validation
    if (maxFinancing === 0) {
      return NextResponse.json({ success: false, error: "Kunne ikke finne finansieringsbeløp i dokumentet." }, { status: 400 });
    }
    if (bidAmount > maxFinancing) {
      return NextResponse.json({ success: false, error: "Budet overstiger finansieringsbeviset." }, { status: 400 });
    }

    // ✅ Insert into Supabase (bids table)
    const referenceCode = uuidv4().slice(0, 8).toUpperCase();
    const { error: insertError } = await supabaseClient.from("bids").insert([
      {
        user_id: userId,
        bid_amount: bidAmount,
        max_financing_amount: maxFinancing,
        reference_code: referenceCode,
        approved: null,
        real_estate_id: propertyId, // <-- use propertyId here
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ success: false, error: "DB insert failed" }, { status: 500 });
    }

    // ✅ Cleanup temp file
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      referenceCode,
      maxFinancing,
      detectedName,
    });
} catch (err) {
    console.error("Verify upload error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}