import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 })

  try {
    const data = await readFile(`./tmp/verification_${code}.json`, "utf8")
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
