"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Copy } from "lucide-react"

export default function FinansieringPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    socialNumber: "",
    phone: "",
    bidAmount: "",
  })

  // Replace with your values
  const clientId = "sandbox-smoggy-shirt-166"
  const redirectUri = "https://v0-norwegian-web-k4esptobi-tottermancrypto-5092s-projects.vercel.app/finansiering"
  const tokenEndpoint = "https://tefi.sandbox.signicat.com/auth/open/connect/token"
  const userinfoEndpoint = "https://tefi.sandbox.signicat.com/auth/open/connect/userinfo"
  const clientSecret = "5519WKMzSHZopB8Hd8HhANTZ0BgZe18aFzVk2CDuDv1odiWd"

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) exchangeCodeForToken(code)
  }, [])

  const exchangeCodeForToken = async (code: string) => {
    const params = new URLSearchParams()
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("client_id", clientId)
    params.append("client_secret", clientSecret)

    try {
      const res = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      })

      const data = await res.json()
      const token = data.access_token

      if (token) fetchUserInfo(token)
    } catch (err) {
      console.error("Token exchange failed", err)
    }
  }

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch(userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const user = await res.json()
      setFormData({
        fullName: user.name || "",
        socialNumber: user.nin || "",
        phone: user.phone || "",
        bidAmount: "",
      })
    } catch (err) {
      console.error("Failed to fetch user info", err)
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
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
              Din BankID-identitet er bekreftet. Fyll inn budbeløp for å generere verifiseringskode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Fullt navn</Label>
                <Input id="fullName" value={formData.fullName} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialNumber">Fødselsnummer</Label>
                <Input id="socialNumber" value={formData.socialNumber} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={formData.phone} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bidAmount">Budbeløp (NOK)</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  placeholder="0"
                  value={formData.bidAmount}
                  onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 mt-6" size="lg">
                Generer verifiseringskode
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
