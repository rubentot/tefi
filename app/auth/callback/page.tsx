// app/auth/callback/page.tsx (Updated to redirect based on role)
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const error_param = urlParams.get("error");
        const error_description = urlParams.get("error_description");

        console.log("🔁 Auth callback - Code:", code?.substring(0, 10) + "...", "State:", state);

        if (error_param) {
          throw new Error(`OAuth Error: ${error_param} - ${error_description || "Unknown error"}`);
        }

        if (!code || !state) {
          throw new Error("Mangler autorisasjonskode eller state parameter");
        }

        // Extract role from state (assuming format like "randomstate_bidder")
        const [, role] = state.split("_");
        if (!role || !["bidder", "broker"].includes(role)) {
          throw new Error("Ugyldig rolle i state parameter");
        }

        setDebugInfo("Utveksler autorisasjonskode via server...");

        const redirectUri = `${window.location.origin}/auth/callback`;

        const codeVerifier = localStorage.getItem("code_verifier");
        if (!codeVerifier) throw new Error("Missing PKCE code_verifier");

        const tokenResponse = await fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state, redirect_uri: redirectUri, code_verifier: codeVerifier }),
        });

        console.log("🔐 Token response status:", tokenResponse.status);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();

        if (!tokenData.sessionData) {
          throw new Error("No session data returned from server");
        }

        // Store session
        localStorage.setItem("bankid_session", JSON.stringify(tokenData.sessionData));

        setDebugInfo(`Omdirigerer til ${role === 'bidder' ? 'personopplysninger' : 'dashboard'}...`);

        setTimeout(() => {
          window.location.href = role === 'bidder' ? "/personal-info" : "/dashboard";
        }, 1500);
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "En ukjent feil oppstod");
        setDebugInfo(`Feil: ${err.message}`);
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
        <Card className="border-red-200 shadow-lg max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">BankID innlogging feilet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium mb-2">Feilmelding:</p>
              <p className="text-red-600 text-sm break-words">{error}</p>
            </div>

            {debugInfo && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Status:</p>
                <p className="text-gray-600 text-sm font-mono break-words">{debugInfo}</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Prøv igjen
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
      <Card className="border-blue-200 shadow-lg max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl text-blue-900">Logger inn med BankID...</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Behandler BankID-autentisering...</p>
          {debugInfo && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm">{debugInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}