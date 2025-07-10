"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")
        const error_param = urlParams.get("error")
        const error_description = urlParams.get("error_description")

        console.log("🔁 Auth callback - Code:", code?.substring(0, 10) + "...", "State:", state)

        // Check for OAuth errors first
        if (error_param) {
          throw new Error(`OAuth Error: ${error_param} - ${error_description || "Unknown error"}`)
        }

        if (!code || !state) {
          throw new Error("Mangler autorisasjonskode eller state parameter")
        }

        // Extract role from state
        const [, role] = state.split("_")
        if (!role || !["bidder", "broker"].includes(role)) {
          throw new Error("Ugyldig rolle i state parameter")
        }

        setDebugInfo("Utveksler autorisasjonskode direkte...")

        // Exchange code for token directly (simplified approach)
        const tokenResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
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

      let tokenData: any

try {
  tokenData = await tokenResponse.json()
} catch (e) {
  const rawBody = await tokenResponse.text()
  throw new Error(`Token response was not valid JSON: ${tokenResponse.status} - ${rawBody}`)
}

if (!tokenResponse.ok) {
  throw new Error(`Token exchange failed: ${tokenResponse.status} - ${JSON.stringify(tokenData)}`)
}


        setDebugInfo("Henter brukerinformasjon...")

        // Get user info
        const userInfoResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text()
          throw new Error(`User info failed: ${userInfoResponse.status} - ${errorText}`)
        }

        const userInfo = await userInfoResponse.json()
        console.log("👤 User info received")

        // Store user session
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

        localStorage.setItem("bankid_session", JSON.stringify(sessionData))

        setDebugInfo(`Omdirigerer til ${role} dashboard...`)

        // Redirect based on role
        setTimeout(() => {
          if (role === "bidder") {
            window.location.href = "/eiendom/3837340"
          } else if (role === "broker") {
            window.location.href = "/verifiser"
          }
        }, 1500)
      } catch (err: any) {
        console.error("💥 Auth callback error:", err)
        setError(err.message || "En ukjent feil oppstod")
        setDebugInfo(`Feil: ${err.message}`)
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [])

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

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-700 font-medium mb-2">Mulige løsninger:</p>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>
                  • Sjekk at Signicat redirect URI er:{" "}
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    https://tefi-git-main-tottermancrypto-5092s-projects.vercel.app/auth/callback
                  </code>
                </li>
                <li>• Kontroller at client_id og client_secret er korrekte</li>
                <li>• Prøv å logge inn på nytt</li>
              </ul>
            </div>

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
    )
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
  )
}
