import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { createWorker } from "tesseract.js"
import { extractText, getDocumentProxy } from "unpdf"
import { addProof } from "@/lib/mockBank"; // For storing extracted limit
import os from "os";

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const expectedName = formData.get("expectedName") as string
  const bidAmount = parseFloat(formData.get("bidAmount") as string) // New: Send bid from frontend for comparison

  if (!file || isNaN(bidAmount)) {
    return NextResponse.json({ success: false, message: "Ingen fil eller budbeløp mottatt" }, { status: 400 })
  }

  if (!expectedName) {
    return NextResponse.json({ success: false, message: "Mangler forventet navn" }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save file temporarily
    const tmpPath = path.join(os.tmpdir(), `${uuidv4()}-${file.name}`)
    await writeFile(tmpPath, buffer)

    let extractedText = ""

    if (file.name.toLowerCase().endsWith(".pdf")) {
      console.log("📄 Processing PDF file...")
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      extractedText = text
    } else {
      console.log("🖼️ Processing image file with OCR...")
      const worker = await createWorker('nor+eng');
      const { data } = await worker.recognize(tmpPath)
      extractedText = data.text
      await worker.terminate()
    }

    await unlink(tmpPath) // Delete file immediately

    console.log("📝 Extracted text:", extractedText.substring(0, 200) + "...")

    // Clean and normalize text for better matching
    const normalizedText = extractedText.toLowerCase().replace(/\s+/g, " ")

    // Name match
    const nameWords = expectedName.toLowerCase().replace(/\s+/g, " ").split(" ")
    const nameMatch = nameWords.every((word) => normalizedText.includes(word))

    // Extract loan amount (look for keywords like "godkjent beløp", "låneramme", "finansieringsbevis for kr")
    const loanKeywords = ["godkjent lånebeløp", "låneramme", "finansieringsbevis for", "beløp kr", "maksimalt lån", "maks lån"];
    let extractedLoan = 0;
    const allMatches: number[] = [];
    for (const keyword of loanKeywords) {
      const regex = new RegExp(`${keyword}\\s*[:=-]?\\s*([\\d\\s.,]+)\\s*(kr|nok)?`, "gi");
      let match;
      while ((match = regex.exec(extractedText)) !== null) {
        const amountStr = match[1].replace(/\D/g, "");
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) allMatches.push(amount);
      }
    }
    if (allMatches.length > 0) {
      extractedLoan = Math.max(...allMatches);
    }

    const sufficiencyMatch = extractedLoan >= bidAmount;

    console.log("🔍 Verification results:", {
      nameMatch,
      extractedLoan,
      sufficiencyMatch,
      bidAmount,
    })

    if (nameMatch && sufficiencyMatch) {
      // Mock userId; in real, from session
      await addProof('mock-user-id-from-session', extractedLoan); // Store extracted limit for later verifyBid
      return NextResponse.json({
        success: true,
        message: "Finansieringsbevis er verifisert. Lånebeløp er tilstrekkelig.",
      })
    } else {
      let errorMessage = "Verifisering feilet: ";
      if (!nameMatch) errorMessage += "Navnet stemmer ikke. ";
      if (!sufficiencyMatch) errorMessage += "Lånebeløp er ikke tilstrekkelig for budet.";
      return NextResponse.json({ success: false, message: errorMessage })
    }
  } catch (err: any) {
    console.error("⛔ Error during file processing:", err)
    return NextResponse.json(
      { success: false, message: "Feil under behandling av fil. Prøv igjen eller kontakt support." },
      { status: 500 }
    )
  }
}