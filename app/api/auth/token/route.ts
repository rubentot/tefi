import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken"; // For decoding id_token (use verify for production)

export async function POST(req: NextRequest) {
  try {
    const { code, state, redirect_uri, code_verifier } = await req.json();

    if (!code || !state || !redirect_uri || !code_verifier) {
      return NextResponse.json({ error: "Missing required parameters (PKCE code_verifier is mandatory as of 2025)" }, { status: 400 });
    }


    const discoveryUrl = 'https://auth.bankid.no/auth/realms/prod/.well-known/openid-configuration'; // Or test version
const configRes = await fetch(discoveryUrl);
const config = await configRes.json();
const tokenEndpoint = config.token_endpoint;
    // Extract role from state (for session)
    const [, role] = state.split("_");

    // BankID token exchange
    const clientId = process.env.BANKID_CLIENT_ID;
    const clientSecret = process.env.BANKID_CLIENT_SECRET;
    // Token endpoint should ideally be fetched from .well-known/openid-configuration
    // Example: await fetch('https://auth.bankid.no/.well-known/openid-configuration').then(res => res.json()).then(config => config.token_endpoint)
    const tokenEndpoint = process.env.BANKID_TOKEN_ENDPOINT;

    if (!clientId || !clientSecret || !tokenEndpoint) {
      throw new Error("Missing BankID env vars");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const formData = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri,
      code_verifier, // Mandatory for PKCE compliance in 2025
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

    // Decode and verify id_token (add JWKS validation in prod)
    // Example: Use jwks-rsa to fetch keys and jwt.verify(tokens.id_token, key, { algorithms: ['RS256'] })
    const decodedIdToken = jwt.decode(tokens.id_token) as any;

    if (!decodedIdToken) {
      throw new Error("Invalid id_token");
    }

    // Build session data with updated claims (BankID uses 'norwegian_nin' for fødselsnummer)
    const sessionData = {
      role,
      user: {
        id: decodedIdToken.sub,
        name: decodedIdToken.name || `${decodedIdToken.given_name} ${decodedIdToken.family_name}`,
        email: decodedIdToken.email,
        phone: decodedIdToken.phone_number,
        socialNumber: decodedIdToken.norwegian_nin || decodedIdToken.birthnumber, // Updated to preferred claim
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