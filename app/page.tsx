"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, User, Building, CheckCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<"bidder" | "broker" | null>(null)

  const handleBankIdLogin = (role: "bidder" | "broker") => {
    const clientId = "sandbox-smoggy-shirt-166"

    // This will work for both localhost and production
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/auth/callback`

    const scope = "openid profile"
    const responseType = "code"
    const acr = "urn:signicat:oidc:method:nbid"
    const prompt = "login"
    const state = `${crypto.randomUUID()}_${role}`

    console.log("🔗 Redirect URI:", redirectUri) // For debugging

    const authUrl = `https://tefi.sandbox.signicat.com/auth/open/connect/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scope}&acr_values=${acr}&prompt=${prompt}&state=${state}`

    window.location.href = authUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-8">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Tefi
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
              Sikker elektronisk budgivning og finansieringsbekreftelse
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">Logg inn med BankID for å starte budprosessen på eiendom</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card
              className={`group relative overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                selectedRole === "bidder"
                  ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200/50"
                  : "border-gray-200 hover:border-green-300 bg-white"
              }`}
              onClick={() => setSelectedRole("bidder")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900 mb-2">Jeg er budgiver</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Gi bud på eiendom og bekreft finansiering trygt med BankID
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3 mb-6">
                  {[
                    "Elektronisk budgivning",
                    "BankID-autentisering",
                    "Automatisk utfylling av persondata",
                    "Sikker budprosess",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                {selectedRole === "bidder" && (
                  <Button
                    onClick={() => handleBankIdLogin("bidder")}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Start budprosess med BankID
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card
              className={`group relative overflow-hidden border-2 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                selectedRole === "broker"
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-200/50"
                  : "border-gray-200 hover:border-blue-300 bg-white"
              }`}
              onClick={() => setSelectedRole("broker")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <CardHeader className="relative text-center pb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Building className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900 mb-2">Jeg er megler</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Verifiser budgivers finansiering og administrer budprosess
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3 mb-6">
                  {[
                    "Verifiser budgivers koder",
                    "Se finansieringsbekreftelser",
                    "Kontroller dokumentasjon",
                    "Administrer budprosess",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                {selectedRole === "broker" && (
                  <Button
                    onClick={() => handleBankIdLogin("broker")}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Logg inn som megler
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {!selectedRole && (
            <div className="text-center mt-12">
              <p className="text-gray-500 text-lg">👆 Velg din rolle for å fortsette</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Slik fungerer det</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-lg">Logg inn med BankID</h3>
              <p className="text-gray-600">Sikker autentisering med norsk BankID</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-lg">Fyll ut budskjema</h3>
              <p className="text-gray-600">Persondata fylles automatisk ut fra BankID</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-lg">Send bud</h3>
              <p className="text-gray-600">Budet sendes sikkert til megler</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
