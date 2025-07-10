"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Search, User, CreditCard, Clock, LogOut, Building } from "lucide-react"
import Image from "next/image"

interface UserSession {
  role: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    socialNumber: string
  }
  accessToken: string
  loginTime: number
}

interface VerificationData {
  code: string
  fullName: string
  bidAmount: string
  timestamp: number
  expiresAt: number
  socialNumber?: string
  phone?: string
  documentVerified?: boolean
}

export default function VerifiserPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [code, setCode] = useState("")
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    data?: VerificationData
    message: string
  } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session")
    if (!sessionData) {
      window.location.href = "/"
      return
    }

    try {
      const parsedSession = JSON.parse(sessionData)
      if (parsedSession.role !== "broker") {
        window.location.href = "/"
        return
      }
      setSession(parsedSession)
    } catch (err) {
      console.error("Invalid session data")
      window.location.href = "/"
      return
    }

    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("bankid_session")
    window.location.href = "/"
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)

    // Simulate API call delay
    setTimeout(() => {
      const storedData = localStorage.getItem(`verification_${code.toUpperCase()}`)

      if (!storedData) {
        setVerificationResult({
          success: false,
          message: "Ugyldig kode - koden finnes ikke i systemet",
        })
        setIsVerifying(false)
        return
      }

      const verificationData: VerificationData = JSON.parse(storedData)

      // Check if code has expired
      if (Date.now() > verificationData.expiresAt) {
        // Remove expired code
        localStorage.removeItem(`verification_${code.toUpperCase()}`)
        setVerificationResult({
          success: false,
          message: "Utløpt kode - koden er ikke lenger gyldig",
        })
        setIsVerifying(false)
        return
      }

      setVerificationResult({
        success: true,
        data: verificationData,
        message: "Finansiering bekreftet",
      })
      setIsVerifying(false)
    }, 1000)
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("no-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
    }).format(Number.parseInt(amount))
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("no-NO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image src="/tefi_logo.svg" alt="Tefi Logo" width={30} height={30} className="mr-2" />
              <h1 className="text-2xl font-bold text-blue-900">Tefi - Megler Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Megler: {session?.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logg ut
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto pt-12 px-4">
        <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-900">Verifiser finansiering</CardTitle>
            <CardDescription className="text-gray-600">
              Skriv inn verifiseringskoden fra budgiver for å bekrefte finansiering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Verifiseringskode</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="N3Z72F"
                  className="border-blue-300 focus:border-blue-500 rounded-md shadow-sm text-center text-lg tracking-wider"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500">Skriv inn 6-tegns koden fra budgiver</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                size="lg"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? "Verifiserer..." : "Verifiser finansiering"}
              </Button>
            </form>

            {verificationResult && (
              <div className="mt-6">
                {verificationResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-semibold text-lg">{verificationResult.message}</span>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-600">Budgiver</Label>
                          <p className="font-semibold text-gray-900 text-lg">{verificationResult.data?.fullName}</p>
                          {verificationResult.data?.phone && (
                            <p className="text-sm text-gray-600">Tlf: {verificationResult.data.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-600">Budbeløp</Label>
                          <p className="font-bold text-gray-900 text-xl">
                            {verificationResult.data?.bidAmount && formatAmount(verificationResult.data.bidAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-600">Status</Label>
                          <p className="font-semibold text-green-900">✅ Finansiering bekreftet</p>
                          {verificationResult.data?.documentVerified && (
                            <p className="text-sm text-green-700">Finansieringsbevis verifisert</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-gray-600">Tidspunkt for verifisering</Label>
                          <p className="font-medium text-gray-900">
                            {verificationResult.data?.timestamp && formatTimestamp(verificationResult.data.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Merk:</strong> Denne verifiseringen er gyldig og budgiveren har bekreftet sin
                        finansiering med BankID.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                      <XCircle className="w-6 h-6" />
                      <span className="font-semibold">{verificationResult.message}</span>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        <strong>Mulige årsaker:</strong>
                      </p>
                      <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                        <li>Koden er skrevet inn feil</li>
                        <li>Koden har utløpt (gyldighet: 10 minutter)</li>
                        <li>Koden eksisterer ikke i systemet</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
