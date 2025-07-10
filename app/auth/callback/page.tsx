"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")

        console.log("🔁 Auth callback - Code:", code, "State:", state)

        if (!code || !state) {
          throw new Error("Mangler autorisasjonskode eller state parameter")
        }

        // Extract role from state
        const [, role] = state.split("_")
        if (!role || !["bidder", "broker"].includes(role)) {
          throw new Error("Ugyldig rolle i state parameter")
        }

        // Exchange code for token
        const tokenResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: `${window.location.origin}/auth/callback`,
            client_id: "sandbox-smoggy-shirt-166",
            client_secret: "5519WKMzSHZopB8Hd8HhANTZ0BgZe18aFzVk2CDuDv1odiWd",
          }),
        })

        const tokenData = await tokenResponse.json()
        console.log("🔐 Token response:", tokenData)

        if (!tokenData.access_token) {
          throw new Error("Kunne ikke hente tilgangstoken fra BankID")
        }

        // Get user info
        const userInfoResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        })

        const userInfo = await userInfoResponse.json()
        console.log("👤 User info:", userInfo)

        // Store user session
        const sessionData = {
          role,
          user: {
            id: userInfo.sub,
            name: `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim(),
            email: userInfo.email,
            phone: userInfo.phone_number,
            socialNumber: userInfo.sub,
          },
          accessToken: tokenData.access_token,
          loginTime: Date.now(),
        }

        localStorage.setItem("bankid_session", JSON.stringify(sessionData))

        // Redirect based on role
        if (role === "bidder") {
          window.location.href = "/eiendom" // Go to property listing first
        } else if (role === "broker") {
          window.location.href = "/verifiser"
        }
      } catch (err: any) {
        console.error("💥 Auth callback error:", err)
        setError(err.message || "En feil oppstod under innlogging")
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
        <Card className="border-red-200 shadow-lg max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">Innlogging feilet</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Prøv igjen
            </button>
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
          <CardTitle className="text-2xl text-blue-900">Logger inn...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">Behandler BankID-innlogging, vennligst vent...</p>
        </CardContent>
      </Card>
    </div>
  )
}
