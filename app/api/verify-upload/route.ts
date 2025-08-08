import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import Tesseract from "tesseract.js";
import PDFParser from "pdf2json";
import { Mistral } from "@mistralai/mistralai";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

// Helper function to parse Norwegian written numbers (e.g., "to millioner" → 2000000)
function parseNorwegianWrittenNumber(text: string): number | null {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const numberMap: { [key: string]: number } = {
    null: 0, en: 1, én: 1, to: 2, tre: 3, fire: 4, fem: 5, seks: 6, syv: 7, åtte: 8, ni: 9,
    ti: 10, elleve: 11, tolv: 12, tretten: 13, fjorten: 14, femten: 15, seksten: 16, sytten: 17, atten: 18, nitten: 19,
    tjue: 20, tretti: 30, førti: 40, femti: 50, seksti: 60, sytti: 70, åtti: 80, nitti: 90,
    hundre: 100, tusen: 1000, million: 1000000, millioner: 1000000,
  };

  const segments = normalized.split(/(?:låneramme|finansieringsbeløp|maksimalt lån|beløp|kr|nok)/i);
  for (const segment of segments) {
    const words = segment.trim().split(" ");
    let total = 0;
    let current = 0;
    for (const word of words) {
      const value = numberMap[word];
      if (value) {
        if (value >= 1000) {
          total += (current || 1) * value;
          current = 0;
        } else if (value >= 100) {
          current = (current || 1) * value;
        } else {
          current += value;
        }
      }
    }
    total += current;
    if (total > 50000) return total;
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log("API /api/verify-upload called");
  try {
    const formData = await req.formData();
    console.log("formData received");
    const file = formData.get("file") as File;
    const expectedName = formData.get("expectedName") as string;
    const bidAmount = parseFloat(formData.get("bidAmount") as string);
    const userId = formData.get("userId") as string;
    const propertyId = (formData.get("propertyId") as string) || "unknown_property";
    console.log("Fields extracted", { fileName: file?.name, expectedName, bidAmount, userId, propertyId });

    if (!file || !expectedName || isNaN(bidAmount) || !userId || !propertyId) {
      console.log("Missing or invalid fields");
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
    }

    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
      console.log("Buffer created", { size: buffer.length, name: file.name });
    } catch (err) {
      console.error("Error creating buffer from file:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to create buffer: ${errorMessage}`);
    }

    const tempDir = path.join(os.tmpdir(), `upload-${Date.now()}-${uuidv4()}`);
    try {
      await fs.mkdir(tempDir, { recursive: true });
      console.log("Temp directory created:", tempDir);
    } catch (err) {
      console.error("Error creating temp directory:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to create temp directory: ${errorMessage}`);
    }

    const filePath = path.join(tempDir, file.name);
    try {
      await fs.writeFile(filePath, buffer);
      console.log("File written to disk:", filePath);
    } catch (err) {
      console.error("Error writing file to disk:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write file: ${errorMessage}`);
    }

    let textContent = "";

    if (file.name.toLowerCase().endsWith(".pdf")) {
      console.log("📄 Processing PDF file with pdf2json...");
      try {
        const parser = new PDFParser();
        const pdfData = await new Promise<string>((resolve, reject) => {
          parser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
          parser.on("pdfParser_dataReady", (pdfData: any) => {
            let text = "";
            pdfData.Pages.forEach((page: any) => {
              page.Texts.forEach((textObj: any) => {
                try {
                  text += decodeURIComponent(textObj.R[0].T) + " ";
                } catch (decodeErr) {
                  console.warn("Failed to decode text object:", decodeErr);
                }
              });
            });
            resolve(text);
          });
          parser.parseBuffer(buffer);
        });
        textContent = pdfData;
        console.log("PDF parsed, text length:", textContent.length);
        if (textContent.trim().length < 100) {
          console.log("PDF text too short, trying OCR...");
          const worker = await Tesseract.createWorker(['nor', 'eng']);
          const { data } = await worker.recognize(filePath);
          textContent = data.text;
          console.log("OCR fallback completed, text length:", textContent.length);
          await worker.terminate();
        }
      } catch (err) {
        console.error("PDF processing error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to process PDF: ${errorMessage}`);
      }
    } else {
      console.log("🖼️ Processing image file with OCR...");
      try {
        const worker = await Tesseract.createWorker(['nor', 'eng']);
        const { data } = await worker.recognize(filePath);
        textContent = data.text;
        console.log("OCR completed, text length:", textContent.length);
        await worker.terminate();
      } catch (err) {
        console.error("Error running OCR:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to process image: ${errorMessage}`);
      }
    }

    try {
      await fs.unlink(filePath);
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log("Cleanup complete");
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }

    // Normalize text
    textContent = textContent
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+(?=\d)/g, "")
      .replace(/(\d)\s+(?=\d)/g, "$1")
      .replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ")
      .trim();

    // Log extracted text for debugging
    console.log("Extracted text (full):", textContent);

    // Try Mistral AI for semantic extraction
    let detectedAmounts: number[] = [];
    if (process.env.MISTRAL_API_KEY) {
      try {
        const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
        const response = await mistral.chat.complete({
          model: "mistral-large-latest",
          messages: [
            {
              role: "user",
              content: `Extract the financing amount (finansieringsbeløp or låneramme) from this text as a number. Return only the numeric value (e.g., 1750000). If no clear amount is found, return 0: ${textContent}`,
            },
          ],
        });
        const content = response.choices[0]?.message?.content;
        const amountText = typeof content === "string" ? content.trim() : "";
        if (amountText) {
          const amount = parseFloat(amountText.replace(/\D/g, ""));
          if (!isNaN(amount) && amount > 50000) {
            detectedAmounts.push(amount);
            console.log("Mistral extracted amount:", amount);
          } else {
            console.log("Mistral returned invalid or small amount:", amountText);
          }
        } else {
          console.log("Mistral response missing content:", response);
        }
      } catch (err) {
        console.error("Mistral extraction error:", err instanceof Error ? err.message : String(err));
      }
    } else {
      console.log("Mistral API key missing, skipping semantic extraction");
    }

    // Fallback to regex-based extraction
    const amountMatch = textContent.match(/(?:\b(?:NOK|kr|Kr|NOK\s+|kr\s+|Kr\s+|kroner\s+|kroner|låneramme\s+|finansieringsbeløp\s+|beløp\s+)?)\s*(\d{1,3}(?:[.,\s']?\d{3})*(?:[.,]\d{1,2})?(?:\s*(?:NOK|kr|Kr|kroner))?|\d{4,}(?!\d)(?:\s*(?:NOK|kr|Kr|kroner))?)/gi);
    if (amountMatch) {
      const regexAmounts = amountMatch
        .map((a) => {
          console.log("Raw matched amount:", a);
          const cleaned = a
            .replace(/[.,\s']/g, "")
            .replace(/^0+/, "");
          console.log("Cleaned amount:", cleaned);
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        })
        .filter((n) => n > 50000 && !/^\d{2}\.\d{2}\.\d{4}$/.test(String(n)));
      detectedAmounts.push(...regexAmounts);
    }

    // Fallback to written number parser
    const writtenAmount = parseNorwegianWrittenNumber(textContent);
    if (writtenAmount) {
      detectedAmounts.push(writtenAmount);
      console.log("Detected written amount:", writtenAmount);
    }

    const maxFinancing = detectedAmounts.length > 0 ? Math.max(...detectedAmounts) : 0;

    // Extract name
    const normalizedText = textContent.toLowerCase();
    const normalizedExpectedName = expectedName.toLowerCase();
    const detectedName = normalizedText.includes(normalizedExpectedName)
      ? expectedName
      : textContent.split(" ").find((line) => line.toLowerCase().includes(normalizedExpectedName)) || "Ukjent";

    // Validation
    if (maxFinancing === 0) {
      console.log("No valid financing amount found", { detectedAmounts, amountMatch });
      return NextResponse.json({ success: false, error: "Kunne ikke finne finansieringsbeløp i dokumentet." }, { status: 400 });
    }
    if (bidAmount > maxFinancing) {
      console.log("Bid exceeds financing", { bidAmount, maxFinancing });
      return NextResponse.json({ success: false, error: "Budet overstiger finansieringsbeviset." }, { status: 400 });
    }

    // Insert into Supabase
    const referenceCode = uuidv4().slice(0, 8).toUpperCase();
    try {
      const { error: insertError } = await supabaseServer.from("bids").insert([
        {
          user_id: userId,
          bid_amount: bidAmount,
          max_financing_amount: maxFinancing,
          reference_code: referenceCode,
          approved: null,
          real_estate_id: propertyId,
        },
      ]);
      if (insertError) {
        console.error("Supabase insert error:", insertError.message);
        return NextResponse.json({ success: false, error: "Failed to save bid" }, { status: 500 });
      }
      console.log("Inserted into Supabase, referenceCode:", referenceCode);
    } catch (err) {
      console.error("Error inserting into Supabase:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to insert bid: ${errorMessage}`);
    }

    // Return JSON for client-side redirect
    return NextResponse.json({
      success: true,
      message: "Opplastning vellykket",
    });

  } catch (err) {
    if (err instanceof Error) {
      console.error("Verify upload error:", err.message, err.stack);
      const errorMessage = err.message;
      return NextResponse.json({ success: false, error: `Server error: ${errorMessage}` }, { status: 500 });
    } else {
      console.error("Verify upload error:", String(err));
      const errorMessage = String(err);
      return NextResponse.json({ success: false, error: `Server error: ${errorMessage}` }, { status: 500 });
    }
  }
}