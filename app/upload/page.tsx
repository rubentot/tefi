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
import { addBid } from "@/lib/mockBank";

interface UserSession {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
    address?: string;
  };
  accessToken: string;
  loginTime: number;
  bidType?: string;
  secondBuyer?: {
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
  };
  bidAmount?: string; // From bid form
}

export default function UploadPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [referenceCode, setReferenceCode] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log("Upload page session:", parsed); // Debug
      setSession(parsed);
      if (parsed.role !== "bidder") {
        router.push("/");
      }
    } else {
      console.log("No session found, redirecting to /");
      router.push("/");
    }
  }, [router]);

  const handleVerifyAndBid = async () => {
    if (!file || !session || !session.bidAmount) return;
    setVerificationStatus("verifying");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("expectedName", session.user.name);
    formData.append("bidAmount", session.bidAmount.toString());
    

    const verifyRes = await fetch("/api/verify-upload", { method: "POST", body: formData });
    const verifyData = await verifyRes.json();

    if (verifyData.success) {
      const code = await addBid(session, parseFloat(session.bidAmount));
      setReferenceCode(code);
      setVerificationStatus("success");
    } else {
      setVerificationStatus("error");
    }
  };

  const uploadInstructions = isMobile 
    ? "På mobil: Ta skjermbilde i bank-appen og last opp, eller lagre e-post som PDF via 'Del' > 'Lagre som PDF'."
    : "Last ned fra bankens portal/e-post som PDF. Hvis i app: Skriv ut til PDF eller ta skjermbilde og konverter.";

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Last opp finansieringsbevis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="file">Last opp bevis (PDF/bilde)</Label>
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
            <Button onClick={handleVerifyAndBid} disabled={verificationStatus === "verifying"} className="w-full">
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
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}