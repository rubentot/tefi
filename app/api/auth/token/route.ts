import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🚀 Token API route called")

  try {
    const body = await request.json()
    console.log("📝 Request body:", body)

    const { code, state } = body

    if (!code || !state) {
      console.log("❌ Missing code or state")
      return NextResponse.json(
        {
          success: false,
          error: "Missing code or state parameter",
        },
        { status: 400 },
      )
    }

    // Extract role from state
    const [, role] = state.split("_")
    if (!role || !["bidder", "broker"].includes(role)) {
      console.log("❌ Invalid role:", role)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role in state parameter",
        },
        { status: 400 },
      )
    }

    console.log("🔄 Exchanging code for token...")

    // Token exchange
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://tefi-git-main-tottermancrypto-5092s-projects.vercel.app/auth/callback",
      client_id: "sandbox-smoggy-shirt-166",
      client_secret: "5519WKMzSHZopB8Hd8HhANTZ0BgZe18aFzVk2CDuDv1odiWd",
    })

    console.log("📤 Token request params:", tokenParams.toString())

    const tokenResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenParams,
    })

    console.log("📥 Token response status:", tokenResponse.status)
    console.log("📥 Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    const tokenText = await tokenResponse.text()
    console.log("📥 Token response text:", tokenText)

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Token exchange failed",
          details: `Status: ${tokenResponse.status}, Response: ${tokenText}`,
        },
        { status: 500 },
      )
    }

    if (!tokenText || tokenText.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Empty token response",
        },
        { status: 500 },
      )
    }

    let tokenData
    try {
      tokenData = JSON.parse(tokenText)
      console.log("✅ Token data parsed:", tokenData)
    } catch (parseError) {
      console.log("❌ Token JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token JSON",
          details: tokenText.substring(0, 500),
        },
        { status: 500 },
      )
    }

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "No access token",
          details: JSON.stringify(tokenData),
        },
        { status: 500 },
      )
    }

    console.log("🔄 Getting user info...")

    // Get user info
    const userResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    console.log("📥 User response status:", userResponse.status)

    const userText = await userResponse.text()
    console.log("📥 User response text:", userText)

    if (!userResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "User info failed",
          details: `Status: ${userResponse.status}, Response: ${userText}`,
        },
        { status: 500 },
      )
    }

    let userInfo
    try {
      userInfo = JSON.parse(userText)
      console.log("✅ User info parsed:", userInfo)
    } catch (parseError) {
      console.log("❌ User JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user JSON",
          details: userText.substring(0, 500),
        },
        { status: 500 },
      )
    }

    // Create session data
    const sessionData = {
      role,
      user: {
        id: userInfo.sub || "unknown",
        name: `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim() || "Unknown User",
        email: userInfo.email || "",
        phone: userInfo.phone_number || "",
        socialNumber: userInfo.sub || "",
      },
      accessToken: tokenData.access_token,
      loginTime: Date.now(),
    }

    console.log("✅ Session data created:", sessionData)

    return NextResponse.json({
      success: true,
      sessionData,
    })
  } catch (error: any) {
    console.error("💥 API route error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
