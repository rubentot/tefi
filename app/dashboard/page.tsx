// app/dashboard/page.tsx (Updated bidder to store bid and generate code; broker to verify and show details if valid)
"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { addProof, verifyBid, addBid, verifyReferenceCode } from "@/lib/mockBank";

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
  const [session, setSession] = useState<UserSession | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [financingLimit, setFinancingLimit] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [referenceCode, setReferenceCode] = useState("");
  const [brokerCode, setBrokerCode] = useState("");
  const [brokerResult, setBrokerResult] = useState<{ valid: boolean; details?: { name: string; email: string; phone: string; bankContact: string } } | null>(null);

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
      await addProof(session.user.id, parseFloat(financingLimit));
      const isValid = await verifyBid(session.user.id, parseFloat(bidAmount));
      if (isValid) {
        const code = await addBid(session, parseFloat(bidAmount));
        setReferenceCode(code);
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
      }
    } else {
      setVerificationStatus("error");
    }
  };

  const handleBrokerVerify = async () => {
    const result = await verifyReferenceCode(brokerCode);
    setBrokerResult(result);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Logg inn for å fortsette...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Velkommen, {session.user.name} ({session.role})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={session.role} className="space-y-6">
            <TabsList>
              <TabsTrigger value="bidder">Budgiver</TabsTrigger>
              <TabsTrigger value="broker">Megler</TabsTrigger>
            </TabsList>
            <TabsContent value="bidder" className="space-y-6">
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
                  <CheckCircle className="mr-2 text-green-600" /> Verifisert! Referansekode: {referenceCode} (gyldig i 5 min)
                </div>
              )}
              {verificationStatus === "error" && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center">
                  <XCircle className="mr-2 text-red-600" /> Verifisering feilet. Prøv igjen.
                </div>
              )}
            </TabsContent>
            <TabsContent value="broker" className="space-y-4">
              <Label htmlFor="brokerCode">Skriv inn referansekode</Label>
              <Input id="brokerCode" placeholder="Skriv inn referansekode" value={brokerCode} onChange={(e) => setBrokerCode(e.target.value)} />
              <Button onClick={handleBrokerVerify}>Verifiser</Button>
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
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}