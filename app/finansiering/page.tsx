"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Copy } from "lucide-react"

export default function FinansieringPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    socialNumber: "",
    phone: "",
    bidAmount: "",
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get("code")

    if (code && !isLoggedIn) {
      const fetchToken = async () => {
        const tokenResponse = await fetch("https://tefi.sandbox.signicat.com/auth/open/connect/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: "https://v0-norwegian-web-k4esptobi-tottermancrypto-5092s-projects.vercel.app/finansiering",
            client_id: "sandbox-smoggy-shirt-166",
            client_secret: "5519WKMzSHZopB8Hd8HhANTZ0BgZe18aFzVk2CDuDv1odiWd",
          }),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.access_token) {
          const userInfoRes = await fetch("https://tefi.sandbox.signicat.com/auth/open/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          })

          const user = await userInfoRes.json()

          setFormData({
            fullName: `${user.given_name} ${user.family_name}` || "",
            socialNumber: user.sub || "",
            phone: user.phone_number || "",
            bidAmount: "",
          })

          setIsLoggedIn(true)
        }
      }

      fetchToken()
    }
  }, [])

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

const handleBankIdLogin = () => {
  const clientId = "sandbox-smoggy-shirt-166"
  const redirectUri = "https://v0-norwegian-web-k4esptobi-tottermancrypto-5092s-projects.vercel.app/finansiering"
  const scope = "openid profile"
  const responseType = "code"
  const acr = "urn:signicat:oidc:method:nbid"
  const prompt = "login"
  const state = crypto.randomUUID() // optional but recommended

  const authUrl = `https://tefi.sandbox.signicat.com/auth/open/connect/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&acr_values=${acr}&prompt=${prompt}&state=${state}`

  window.location.href = authUrl
}




  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const code = generateCode()
    const verificationData = {
      code,
      fullName: formData.fullName,
      bidAmount: formData.bidAmount,
      timestamp: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    }

    localStorage.setItem(`verification_${code}`, JSON.stringify(verificationData))

    setVerificationCode(code)
    setIsSubmitted(true)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(verificationCode)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-blue-900">Din finansiering er bekreftet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Label className="text-sm font-medium text-gray-600">Din verifiseringskode:</Label>
                <div className="mt-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                      {verificationCode}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyCode} className="text-blue-600 hover:text-blue-800">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">
                  <strong>Send denne koden til megler for å bekrefte budet ditt.</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">Koden utløper om 10 minutter</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto pt-12">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-900">Bekreft finansiering</CardTitle>
            <CardDescription className="text-gray-600">
              Logg inn med BankID for å bekrefte din finansiering
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoggedIn ? (
              <div className="space-y-4">
                <Button
                  onClick={handleBankIdLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  size="lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Logg inn med BankID
                </Button>
                <p className="text-xs text-gray-500 text-center">Sikker innlogging med BankID</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Fullt navn</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="border-blue-200 focus:border-blue-500"
                    required
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socialNumber">Fødselsnummer</Label>
                  <Input
                    id="socialNumber"
                    value={formData.socialNumber}
                    onChange={(e) => setFormData({ ...formData, socialNumber: e.target.value })}
                    className="border-blue-200 focus:border-blue-500"
                    required
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-blue-200 focus:border-blue-500"
                    required
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bidAmount">Budbeløp (NOK)</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="0"
                    value={formData.bidAmount}
                    onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-6" size="lg">
                  Bekreft finansiering
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
