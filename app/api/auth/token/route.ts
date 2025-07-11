import { type NextRequest, NextResponse } from "next/server"
// Optional: import jwt from 'jsonwebtoken'; // For signature verification (npm install jsonwebtoken)

export async function POST(request: NextRequest) {
  console.log("🚀 Token API route called")

  try {
    const body = await request.json()
    console.log("📝 Request body:", body)

    const { code, state, redirect_uri } = body

    if (!code || !state || !redirect_uri) {
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
      redirect_uri, // Use the dynamic one
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

    if (!tokenData.id_token) {
      return NextResponse.json(
        {
          success: false,
          error: "No ID token",
          details: JSON.stringify(tokenData),
        },
        { status: 500 },
      )
    }

    console.log("🔄 Parsing user info from ID token...")

    // Decode ID token payload (base64url decode the middle part)
    const idTokenParts = tokenData.id_token.split('.');
    if (idTokenParts.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID token format",
        },
        { status: 500 },
      )
    }

    let idTokenPayload;
    try {
      // Base64 decode and parse JSON
      idTokenPayload = JSON.parse(atob(idTokenParts[1]));
      console.log("✅ ID token payload parsed:", idTokenPayload);
    } catch (parseError) {
      console.log("❌ ID token parse error:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID token payload",
        },
        { status: 500 },
      )
    }

    // Optional: Verify signature (uncomment and configure JWKS)
    // const jwksUrl = 'https://tefi.sandbox.signicat.com/auth/open/.well-known/openid-configuration';
    // // Fetch JWKS keys dynamically, then: jwt.verify(tokenData.id_token, key, { algorithms: ['RS256'] });

    // Create session data from ID token claims
    const sessionData = {
      role,
      user: {
        id: idTokenPayload.sub || "unknown",
        name: `${idTokenPayload.given_name || ""} ${idTokenPayload.family_name || ""}`.trim() || "Unknown User",
        email: idTokenPayload.email || "",
        phone: idTokenPayload.phone_number || "",
        socialNumber: idTokenPayload.sub || "",
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