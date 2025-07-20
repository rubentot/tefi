"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Upload, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { addBid, verifyReferenceCode, updateBidApproval } from "@/lib/mockBank";
import { supabaseClient } from "@/lib/supabase-client";
export const dynamic = 'force-dynamic';

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
  const [bidAmount, setBidAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [referenceCode, setReferenceCode] = useState("");
  const [brokerCode, setBrokerCode] = useState("");
  const [brokerResult, setBrokerResult] = useState<{ valid: boolean; approved?: boolean; details?: { name: string; email: string; phone: string; bankContact: string } } | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
  console.log("Starting session check...");
  const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, supabaseSession) => {
    if (!supabaseSession) {
      setSession(null);
      router.push("/");
      return;
    }

    const isBroker = supabaseSession.user.user_metadata.role === "broker";
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", supabaseSession.user.id)
      .maybeSingle();  // <-- This change

    if (error) console.error("Profile fetch error:", error);  // Log but don't crash

    const mockSession: UserSession = {
      role: isBroker ? "broker" : "bidder",
      user: {
        id: supabaseSession.user.id,
        name: profile?.name || (supabaseSession.user.email?.split("@")[0] ?? "Unknown"),
        email: supabaseSession.user.email ?? "",
        phone: profile?.phone ?? "",
        socialNumber: profile?.social_number ?? "",
      },
      accessToken: supabaseSession.access_token,
      loginTime: Date.now(),
    };

    localStorage.setItem("bankid_session", JSON.stringify(mockSession));
    setSession(mockSession);

    if (isBroker) router.push("/verifiser");
  });

  return () => listener.subscription.unsubscribe();
}, [router]);

  const handleVerifyAndBid = async () => {
    if (!file || !session || !bidAmount) return;
    setVerificationStatus("verifying");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("expectedName", session.user.name);
    formData.append("bidAmount", bidAmount);

    const verifyRes = await fetch("/api/verify-upload", { method: "POST", body: formData });
    const verifyData = await verifyRes.json();

    if (verifyData.success) {
      const code = await addBid(session, parseFloat(bidAmount), "property1");
      setReferenceCode(code);
      setVerificationStatus("success");
    } else {
      setVerificationStatus("error");
    }
  };

  const handleBrokerVerify = async () => {
    const result = await verifyReferenceCode(brokerCode);
    setBrokerResult(result);
  };

  const handleApprove = async (code: string, approved: boolean) => {
    await updateBidApproval(code, approved);
    setBrokerResult(prev => prev ? { ...prev, approved } : null);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Logg inn for å fortsette...</div>;
  }

  const uploadInstructions = isMobile
    ? "På mobil: Ta skjermbilde i bank-appen og last opp, eller lagre e-post som PDF via 'Del' > 'Lagre som PDF'."
    : "Last ned fra bankens portal/e-post som PDF. Hvis i app: Skriv ut til PDF eller ta skjermbilde og konverter.";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Velkommen, {session.user.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {session.role === "bidder" ? (
              <>
                <div>
                  <Label htmlFor="bidAmount">Budbeløp (kr)</Label>
                  <Input id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="file">Last opp finansieringsbevis (PDF/bilde)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{uploadInstructions}</p>
                        <p className="mt-2">Aksepterer PDF, JPG, PNG. Vi sletter filen etter verifisering.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="file" type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {verificationStatus === "error" && (
                    <p className="text-sm text-muted-foreground mt-2">Hvis opplasting feiler, prøv å konvertere til PDF først eller kontakt support.</p>
                  )}
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
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}