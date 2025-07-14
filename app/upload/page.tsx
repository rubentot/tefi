// app/dashboard/page.tsx (Updated for broker-only verify/approve; bidders don't land here)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { verifyReferenceCode, updateBidApproval } from "@/lib/mockBank";

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

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [brokerCode, setBrokerCode] = useState("");
  const [brokerResult, setBrokerResult] = useState<{ valid: boolean; approved?: boolean; details?: { name: string; email: string; phone: string; bankContact: string } } | null>(null);

  useEffect(() => {
  const sessionData = localStorage.getItem("bankid_session");
  if (sessionData) {
    const parsed = JSON.parse(sessionData);
    console.log("Upload page session:", parsed); // Debug
    setSession(parsed);
    if (parsed.role !== "bidder") {
      router.push("/"); // Only if not bidder
    }
  } else {
    console.log("No session found, redirecting to /");
    router.push("/");
  }
}, [router]);

  const handleBrokerVerify = async () => {
    const result = await verifyReferenceCode(brokerCode);
    setBrokerResult(result);
  };

  const handleApprove = async (code: string, approved: boolean) => {
    await updateBidApproval(code, approved);
    setBrokerResult(prev => prev ? { ...prev, approved } : null);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Velkommen, {session.user.name} (Megler)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="brokerCode">Skriv inn referansekode</Label>
          <Input id="brokerCode" placeholder="Skriv inn referansekode" value={brokerCode} onChange={(e) => setBrokerCode(e.target.value)} />
          <Button onClick={handleBrokerVerify} className="w-full">Verifiser</Button>
          {brokerResult && (
            <div className={`p-4 rounded-lg ${brokerResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              {brokerResult.valid ? <CheckCircle className="mr-2 text-green-600" /> : <XCircle className="mr-2 text-red-600" />}
              {brokerResult.valid ? 'Gyldig bud' : 'Ugyldig kode'}
              {brokerResult.valid && brokerResult.details && (
                <div className="mt-2 text-sm">
                  <p><strong>Navn:</strong> {brokerResult.details.name}</p>
                  <p><strong>E-post:</strong> {brokerResult.details.email}</p>
                  <p><strong>Telefon:</strong> {brokerResult.details.phone}</p>
                  <p><strong>Bankkontakt:</strong> {brokerResult.details.bankContact}</p>
                  <div className="mt-4 flex gap-4">
                    <Button variant="default" onClick={() => handleApprove(brokerCode, true)}>
                      Godkjenn
                    </Button>
                    <Button variant="destructive" onClick={() => handleApprove(brokerCode, false)}>
                      Avvis
                    </Button>
                  </div>
                  {brokerResult.approved !== undefined && (
                    <p className="mt-2"><strong>Status:</strong> {brokerResult.approved ? 'Godkjent' : 'Avvist'}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}