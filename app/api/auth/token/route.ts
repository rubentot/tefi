import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json()

    console.log("🔄 Server-side token exchange for code:", code)

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state parameter" }, { status: 400 })
    }

    // Extract role from state
    const [, role] = state.split("_")
    if (!role || !["bidder", "broker"].includes(role)) {
      return NextResponse.json({ error: "Invalid role in state parameter" }, { status: 400 })
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://tefi-git-main-tottermancrypto-5092s-projects.vercel.app/auth/callback",
        client_id: "sandbox-smoggy-shirt-166",
        client_secret: "5519WKMzSHZopB8Hd8HhANTZ0BgZe18aFzVk2CDuDv1odiWd",
      }),
    })

    console.log("🔐 Token response status:", tokenResponse.status)
    console.log("🔐 Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token response error:", errorText)
      return NextResponse.json(
        {
          error: "Token exchange failed",
          details: `${tokenResponse.status}: ${errorText}`,
          status: tokenResponse.status,
        },
        { status: 500 },
      )
    }

    const responseText = await tokenResponse.text()
    console.log("🔐 Raw token response:", responseText)

    if (!responseText || responseText.trim() === "") {
      return NextResponse.json({ error: "Empty response from token endpoint" }, { status: 500 })
    }

    let tokenData
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON response from token endpoint",
          details: responseText.substring(0, 500),
        },
        { status: 500 },
      )
    }

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: "No access token in response",
          details: JSON.stringify(tokenData),
        },
        { status: 500 },
      )
    }

    // Get user info
    const userInfoResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    console.log("👤 User info response status:", userInfoResponse.status)

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error("❌ User info error:", errorText)
      return NextResponse.json(
        {
          error: "User info request failed",
          details: `${userInfoResponse.status}: ${errorText}`,
        },
        { status: 500 },
      )
    }

    const userInfoText = await userInfoResponse.text()
    console.log("👤 Raw user info response:", userInfoText)

    let userInfo
    try {
      userInfo = JSON.parse(userInfoText)
    } catch (parseError) {
      console.error("❌ User info JSON parse error:", parseError)
      return NextResponse.json(
        {
          error: "Invalid user info JSON",
          details: userInfoText.substring(0, 500),
        },
        { status: 500 },
      )
    }

    console.log("👤 Parsed user info:", userInfo)

    // Return session data
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

    return NextResponse.json({ success: true, sessionData })
  } catch (error: any) {
    console.error("💥 Server-side auth error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
