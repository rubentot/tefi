"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { addProof, verifyBid } from "@/lib/mockBank"; // New import

interface UserSession {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
  };
  accessToken: string;
  loginTime: number;
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [financingLimit, setFinancingLimit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [oneTimeCode, setOneTimeCode] = useState("");

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) setSession(JSON.parse(sessionData));
  }, []);

  const handleVerifyAndBid = async () => {
    if (!file || !session || !bidAmount || !financingLimit) return;
    setVerificationStatus("verifying");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("expectedName", session.user.name);
    formData.append("expectedAmount", financingLimit);

    const verifyRes = await fetch("/api/verify-upload", { method: "POST", body: formData });
    const verifyData = await verifyRes.json();

    if (verifyData.success) {
      const token = await addProof(session.user.id, parseFloat(financingLimit)); // Store proof
      const isValid = await verifyBid(session.user.id, parseFloat(bidAmount)); // Check against limit
      if (isValid) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // One-time code (Claim 1,3)
        setOneTimeCode(code);
        // Mock save code with expiration (5 min)
        setTimeout(() => setOneTimeCode(""), 5 * 60 * 1000);
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
      }
    } else {
      setVerificationStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Gi bud på eiendom {params.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="bidAmount">Budbeløp (kr)</Label>
            <Input id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="financingLimit">Forhåndsgodkjent låneramme (kr)</Label>
            <Input id="financingLimit" type="number" value={financingLimit} onChange={(e) => setFinancingLimit(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="file">Last opp finansieringsbevis (PDF/bilde)</Label>
            <Input id="file" type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={handleVerifyAndBid} disabled={verificationStatus === "verifying"}>
            <Upload className="mr-2 h-4 w-4" /> Verifiser og send bud
          </Button>
          {verificationStatus === "success" && (
            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <CheckCircle className="mr-2 text-green-600" /> Verifisert! Engangskode: {oneTimeCode} (gyldig i 5 min)
            </div>
          )}
          {verificationStatus === "error" && (
            <div className="bg-red-50 p-4 rounded-lg flex items-center">
              <XCircle className="mr-2 text-red-600" /> Verifisering feilet. Prøv igjen.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}