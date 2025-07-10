import { type NextRequest, NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import pdfParse from "pdf-parse"
import { createWorker } from "tesseract.js"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const expectedName = formData.get("expectedName") as string
  const expectedAmount = formData.get("expectedAmount") as string

  if (!file) {
    return NextResponse.json({ success: false, message: "Ingen fil mottatt" }, { status: 400 })
  }

  if (!expectedName || !expectedAmount) {
    return NextResponse.json({ success: false, message: "Mangler forventet navn eller beløp" }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save file temporarily to /tmp (safe for Vercel)
    const tmpPath = path.join("/tmp", `${uuidv4()}-${file.name}`)
    await writeFile(tmpPath, buffer)

    let extractedText = ""

    if (file.name.toLowerCase().endsWith(".pdf")) {
      console.log("📄 Processing PDF file...")
      const parsed = await pdfParse(buffer)
      extractedText = parsed.text
    } else {
      console.log("🖼️ Processing image file with OCR...")
      const worker = await createWorker("nor", "eng")
      const { data } = await worker.recognize(tmpPath)
      extractedText = data.text
      await worker.terminate()
    }

    await unlink(tmpPath)

    console.log("📝 Extracted text:", extractedText.substring(0, 200) + "...")

    const normalizedText = extractedText.toLowerCase().replace(/\s+/g, " ")
    const normalizedName = expectedName.toLowerCase().replace(/\s+/g, " ")

    const nameWords = normalizedName.split(" ")
    const nameMatch = nameWords.every((word) => normalizedText.includes(word))

    const numbersInText = extractedText.replace(/\D/g, "")
    const expectedAmountStr = expectedAmount.replace(/\D/g, "")
    const amountMatch = numbersInText.includes(expectedAmountStr)

    console.log("🔍 Verification results:", {
      nameMatch,
      amountMatch,
      expectedName,
      expectedAmount: expectedAmountStr,
      foundNumbers: numbersInText.substring(0, 100),
    })

    if (nameMatch && amountMatch) {
      return NextResponse.json({
        success: true,
        message: "Finansieringsbevis er verifisert og stemmer overens med oppgitt informasjon.",
      })
    }

    let errorMessage = "Verifisering feilet: "
    if (!nameMatch && !amountMatch) {
      errorMessage += "Verken navn eller beløp stemmer med det som ble sendt inn."
    } else if (!nameMatch) {
      errorMessage += "Navnet stemmer ikke med det som ble sendt inn."
    } else {
      errorMessage += "Beløpet stemmer ikke med det som ble sendt inn."
    }

    return NextResponse.json({ success: false, message: errorMessage })

  } catch (err: any) {
    console.error("⛔ Error during file processing:", err)
    return NextResponse.json(
      {
        success: false,
        message: "Feil under behandling av fil. Prøv igjen eller kontakt support.",
      },
      { status: 500 },
    )
  }
}
