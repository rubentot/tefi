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

        console.log("🔁 Auth callback - Code:", code, "State:", state)
        console.log("🔁 Error params:", error_param, error_description)

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

        setDebugInfo(`Exchanging code for token via server...`)

        // Use server-side API route for token exchange
        const response = await fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        })

        console.log("🔄 Server API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ Server API error:", errorData)
          throw new Error(`Server error: ${errorData.error} - ${errorData.details || ""}`)
        }

        const data = await response.json()
        console.log("✅ Server API success:", data)

        if (!data.success || !data.sessionData) {
          throw new Error("Invalid response from server")
        }

        // Store user session
        localStorage.setItem("bankid_session", JSON.stringify(data.sessionData))

        setDebugInfo(`Redirecting to ${role} dashboard...`)

        // Small delay to show success message
        setTimeout(() => {
          // REDIRECT DIRECTLY TO THE BIDDING FORM (PDF PAGES)
          if (role === "bidder") {
            window.location.href = "/eiendom/3837340"
          } else if (role === "broker") {
            window.location.href = "/verifiser"
          }
        }, 1000)
      } catch (err: any) {
        console.error("💥 Auth callback error:", err)
        setError(err.message || "En feil oppstod under innlogging")
        setDebugInfo(`Error: ${err.message}`)
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
            <CardTitle className="text-2xl text-red-900">Innlogging feilet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 font-medium mb-2">Feilmelding:</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>

            {debugInfo && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 font-medium mb-2">Debug info:</p>
                <p className="text-gray-600 text-sm font-mono">{debugInfo}</p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-700 font-medium mb-2">Mulige løsninger:</p>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>• Sjekk at Signicat redirect URI er konfigurert riktig</li>
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
          <p className="text-gray-600">Behandler innlogging og forbereder budskjema...</p>
          {debugInfo && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm font-mono">{debugInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
