"use client"

import type React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean } | null>(null);

  const handleVerify = async () => {
    // Mock API call; in real, check code against stored with expiration/IP log (Claims 3,6,7,8)
    const res = await fetch(`/api/verify-check?code=${code}`);
    const data = await res.json();
    setVerificationResult({ valid: !data.error }); // Binary yes/no
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verifiser bud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Skriv inn engangskode" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={handleVerify}>Verifiser</Button>
          {verificationResult && (
            <div className={`p-4 rounded-lg flex items-center ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              {verificationResult.valid ? <CheckCircle className="mr-2 text-green-600" /> : <XCircle className="mr-2 text-red-600" />}
              {verificationResult.valid ? 'Gyldig bud' : 'Ugyldig kode'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}