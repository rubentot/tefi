// app/api/verify-upload/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // TODO: Use OCR/AI to extract financing amount, name etc.
  console.log("📄 Received file:", file.name)
  console.log("📦 File size (bytes):", buffer.length)

  return NextResponse.json({ success: true, message: "File received" })
}
