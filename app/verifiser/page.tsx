"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

export default function VerifiserPage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<any | null>(null)

  const handleVerify = () => {
    const data = localStorage.getItem(`verification_${code}`)
    if (!data) {
      setResult("invalid")
      return
    }

    const parsed = JSON.parse(data)
    const now = Date.now()
    if (now > parsed.expiresAt) {
      setResult("expired")
      return
    }

    setResult(parsed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="border border-gray-200 shadow">
          <CardHeader>
            <CardTitle>Verifiser Finansieringskode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="code">Kode fra budgiver</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
            <Button onClick={handleVerify} className="w-full bg-blue-600 text-white">
              Verifiser
            </Button>

            {result === "invalid" && (
              <div className="text-red-500 mt-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Ugyldig kode
              </div>
            )}
            {result === "expired" && (
              <div className="text-yellow-600 mt-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Koden er utløpt
              </div>
            )}
            {result && result !== "invalid" && result !== "expired" && (
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Finansiering gyldig</span>
                </div>
                <p><strong>Navn:</strong> {result.fullName}</p>
                <p><strong>Bud:</strong> {result.bidAmount} NOK</p>
                <p><strong>Gyldig til:</strong> {new Date(result.expiresAt).toLocaleTimeString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
