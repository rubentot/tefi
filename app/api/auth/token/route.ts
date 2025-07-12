import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { code, state, redirect_uri, code_verifier } = await req.json();

    if (!code || !state || !redirect_uri || !code_verifier) {
      return NextResponse.json({ error: "Missing required parameters (PKCE code_verifier is mandatory)" }, { status: 400 });
    }

    // Extract role from state
    const [, role] = state.split("_");

    // Use Signicat sandbox discovery (matches your authUrl)
    const discoveryUrl = 'https://tefi.sandbox.signicat.com/auth/open/.well-known/openid-configuration';
    const configRes = await fetch(discoveryUrl);
    if (!configRes.ok) throw new Error("Failed to fetch OIDC discovery config");
    const config = await configRes.json();
    const tokenEndpoint = config.token_endpoint;

    const clientId = process.env.BANKID_CLIENT_ID;
    const clientSecret = process.env.BANKID_CLIENT_SECRET;

    if (!clientId || !clientSecret || !tokenEndpoint) {
      throw new Error("Missing BankID env vars");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      code_verifier,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BankID token exchange failed: ${response.status} - ${errorText}`);
    }

    const tokens = await response.json();

    const decodedIdToken = jwt.decode(tokens.id_token) as any;

    if (!decodedIdToken) {
      throw new Error("Invalid id_token");
    }

    const sessionData = {
      role,
      user: {
        id: decodedIdToken.sub,
        name: decodedIdToken.name || `${decodedIdToken.given_name} ${decodedIdToken.family_name}`,
        email: decodedIdToken.email,
        phone: decodedIdToken.phone_number,
        socialNumber: decodedIdToken.norwegian_nin || decodedIdToken.birthnumber,
      },
      accessToken: tokens.access_token,
      loginTime: Date.now(),
    };

    return NextResponse.json({ sessionData });
  } catch (err: any) {
    console.error("Token API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}