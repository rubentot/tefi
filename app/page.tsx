"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, User, Building, CheckCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<"bidder" | "broker" | null>(null)

  const handleBankIdLogin = (role: "bidder" | "broker") => {
    const clientId = "sandbox-smoggy-shirt-166"
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/auth/callback`
    const scope = "openid profile"
    const responseType = "code"
    const acr = "urn:signicat:oidc:method:nbid"
    const prompt = "login"
    const state = `${crypto.randomUUID()}_${role}` // Include role in state

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
            <p className="text-gray-600 max-w-2xl mx-auto">
              Logg inn med BankID for å få tilgang til Norges mest avanserte plattform for eiendomshandel
            </p>
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
                    "Gi bud på eiendommer",
                    "Bekreft finansiering med BankID",
                    "Last opp finansieringsbevis",
                    "Få verifiseringskode til megler",
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
                    Logg inn som budgiver
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

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hvorfor velge Tefi?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Den mest avanserte og sikre plattformen for elektronisk budgivning i Norge
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "100% Sikker",
                description: "BankID-autentisering og kryptert dataoverføring beskytter all informasjon",
                color: "from-green-400 to-emerald-500",
              },
              {
                icon: CheckCircle,
                title: "Automatisk Verifisering",
                description: "AI-drevet dokumentverifisering og OCR-teknologi for rask behandling",
                color: "from-blue-400 to-indigo-500",
              },
              {
                icon: Building,
                title: "Profesjonell Plattform",
                description: "Brukes av ledende eiendomsmeglere over hele Norge",
                color: "from-purple-400 to-pink-500",
              },
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl mb-6`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Tefi</h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Tefi er Norges ledende plattform for sikker elektronisk budgivning og finansieringsbekreftelse. Med
                BankID kan både budgivere og meglere trygt håndtere hele budprosessen digitalt.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Tjenester</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Elektronisk budgivning
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Finansieringsbekreftelse
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Dokumentverifisering
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Slik fungerer tjenesten
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Personvernerklæring
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kontakt oss
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Tefi. Tefi er en del av eiendomsmeglerprogramvaren Webmegler - levert av Broker AS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
