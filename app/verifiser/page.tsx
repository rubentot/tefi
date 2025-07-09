"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Search, User, CreditCard } from "lucide-react"

interface VerificationData {
  code: string
  fullName: string
  bidAmount: string
  timestamp: number
  expiresAt: number
  documentVerified?: boolean
}

export default function VerifiserPage() {
  const [code, setCode] = useState("")
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    data?: VerificationData
    message: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const storedData = localStorage.getItem(`verification_${code.toUpperCase()}`)

      if (!storedData) {
        setVerificationResult({
          success: false,
          message: "Ugyldig eller utløpt kode",
        })
        setIsLoading(false)
        return
      }

      const verificationData: VerificationData = JSON.parse(storedData)

      // Check if code has expired
      if (Date.now() > verificationData.expiresAt) {
        // Remove expired code
        localStorage.removeItem(`verification_${code.toUpperCase()}`)
        setVerificationResult({
          success: false,
          message: "Ugyldig eller utløpt kode",
        })
        setIsLoading(false)
        return
      }

      setVerificationResult({
        success: true,
        data: verificationData,
        message: "Finansiering bekreftet",
      })
      setIsLoading(false)
    }, 1000)
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("no-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
    }).format(Number.parseInt(amount))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto pt-12">
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-blue-900">Verifiser budgiver</CardTitle>
            <CardDescription className="text-gray-600">Skriv inn verifiseringskoden fra budgiver</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verifiseringskode</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="A3KF9D"
                  className="border-blue-200 focus:border-blue-500 font-mono text-center text-lg tracking-wider"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "Verifiserer..." : "Verifiser"}
              </Button>
            </form>

            {verificationResult && (
              <div className="mt-6">
                {verificationResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-semibold">{verificationResult.message}</span>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-green-600" />
                        <div>
                          <Label className="text-sm text-gray-600">Fullt navn</Label>
                          <p className="font-semibold text-gray-900">{verificationResult.data?.fullName}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <div>
                          <Label className="text-sm text-gray-600">Budbeløp</Label>
                          <p className="font-semibold text-gray-900">
                            {verificationResult.data?.bidAmount && formatAmount(verificationResult.data.bidAmount)}
                          </p>
                        </div>
                      </div>

                      {verificationResult.data?.documentVerified && (
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <Label className="text-sm text-gray-600">Dokumentstatus</Label>
                            <p className="font-semibold text-green-900">✅ Finansieringsbevis verifisert</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold">{verificationResult.message}</span>
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
