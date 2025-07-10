"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addLog("🚀 Starting auth callback process")

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")
        const error_param = urlParams.get("error")
        const error_description = urlParams.get("error_description")

        addLog(`📝 URL params - Code: ${code ? "present" : "missing"}, State: ${state ? "present" : "missing"}`)

        // Check for OAuth errors first
        if (error_param) {
          throw new Error(`OAuth Error: ${error_param} - ${error_description || "Unknown error"}`)
        }

        if (!code || !state) {
          throw new Error("Mangler autorisasjonskode eller state parameter")
        }

        // Test if API routes work at all
        addLog("🧪 Testing API routes...")
        setDebugInfo("Tester API tilkobling...")

        try {
          const testResponse = await fetch("/api/test")
          addLog(`🧪 Test API status: ${testResponse.status}`)

          if (testResponse.ok) {
            const testData = await testResponse.json()
            addLog(`✅ API routes working: ${testData.message}`)
          } else {
            addLog(`❌ Test API failed: ${testResponse.status}`)
          }
        } catch (testError: any) {
          addLog(`❌ Test API error: ${testError.message}`)
        }

        // Try the token exchange
        addLog("🔄 Attempting token exchange...")
        setDebugInfo("Utveksler autorisasjonskode...")

        const response = await fetch("/api/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        })

        addLog(`📥 Token API status: ${response.status}`)
        addLog(`📥 Token API headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)

        // Check if we got any response at all
        if (!response) {
          throw new Error("Ingen respons fra server")
        }

        // Try to get response text
        let responseText = ""
        try {
          responseText = await response.text()
          addLog(`📥 Response text length: ${responseText.length}`)
          addLog(`📥 Response text preview: ${responseText.substring(0, 100)}...`)
        } catch (textError: any) {
          addLog(`❌ Failed to get response text: ${textError.message}`)
          throw new Error("Kunne ikke lese respons fra server")
        }

        if (!responseText || responseText.trim() === "") {
          throw new Error("Tom respons fra server")
        }

        // Try to parse JSON
        let data
        try {
          data = JSON.parse(responseText)
          addLog("✅ JSON parsed successfully")
        } catch (parseError: any) {
          addLog(`❌ JSON parse error: ${parseError.message}`)
          addLog(`❌ Raw response: ${responseText}`)
          throw new Error(`Ugyldig JSON fra server: ${parseError.message}`)
        }

        if (!data.success) {
          addLog(`❌ Server returned error: ${data.error}`)
          throw new Error(`Server feil: ${data.error} - ${data.details || ""}`)
        }

        if (!data.sessionData) {
          throw new Error("Mangler session data fra server")
        }

        addLog("✅ Session data received, storing...")
        localStorage.setItem("bankid_session", JSON.stringify(data.sessionData))

        const role = data.sessionData.role
        addLog(`🎯 Redirecting to ${role} dashboard`)
        setDebugInfo(`Omdirigerer til ${role} dashboard...`)

        setTimeout(() => {
          if (role === "bidder") {
            window.location.href = "/eiendom/3837340"
          } else if (role === "broker") {
            window.location.href = "/verifiser"
          }
        }, 2000)
      } catch (err: any) {
        addLog(`💥 Error: ${err.message}`)
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
        <Card className="border-red-200 shadow-lg max-w-4xl">
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

            {logs.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-h-64 overflow-y-auto">
                <p className="text-blue-700 font-medium mb-2">Detaljert logg:</p>
                <div className="text-blue-600 text-xs font-mono space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="break-words">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-700 font-medium mb-2">Feilsøking:</p>
              <ul className="text-yellow-600 text-sm space-y-1">
                <li>• Sjekk at Vercel deployment inkluderer API routes</li>
                <li>• Kontroller Signicat redirect URI konfiguration</li>
                <li>• Se Vercel function logs for server-side feil</li>
                <li>
                  • Test API route direkte: <code>/api/test</code>
                </li>
              </ul>
            </div>

            <div className="text-center space-x-4">
              <button
                onClick={() => window.open("/api/test", "_blank")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Test API
              </button>
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
      <Card className="border-blue-200 shadow-lg max-w-2xl">
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

          {logs.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
              <p className="text-gray-700 font-medium mb-2 text-sm">Prosess logg:</p>
              <div className="text-gray-600 text-xs font-mono space-y-1">
                {logs.slice(-5).map((log, index) => (
                  <div key={index} className="break-words">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
