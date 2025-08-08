"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Upload,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

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
  bidAmount?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [apiMessage, setApiMessage] = useState<string>("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
      if (!parsed?.user) {
        console.error("No user in session");
        router.push("/");
        return;
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleVerifyAndBid = async () => {
    if (!file || !session || !session.bidAmount) {
      setVerificationStatus("error");
      setApiMessage("Manglende fil, sesjon eller budbeløp.");
      return;
    }

    setVerificationStatus("verifying");
    setApiMessage("");

    const formData = new FormData();
    formData.append("propertyId", "property1");
    formData.append("userId", session.user.id);
    formData.append("file", file);
    formData.append("expectedName", session.user.name);
    formData.append("bidAmount", session.bidAmount.toString());

    try {
      const verifyRes = await fetch("/api/verify-upload", {
        method: "POST",
        body: formData,
      });
      const verifyData = await verifyRes.json();
      console.log("API Response:", verifyData);

      if (verifyData.success) {
        setVerificationStatus("success");
        setApiMessage(verifyData.message || "Opplastning vellykket!");
        // Redirect to success page after a short delay to show feedback
        setTimeout(() => router.push("/success"), 1000);
      } else {
        setVerificationStatus("error");
        setApiMessage(verifyData.message || "Verifisering feilet. Prøv igjen.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setVerificationStatus("error");
      setApiMessage("Nettverksfeil under opplasting. Prøv igjen.");
    }
  };

  const uploadInstructions = isMobile
    ? "På mobil: Ta skjermbilde i bank-appen og last opp, eller lagre e-post som PDF via 'Del' > 'Lagre som PDF'."
    : "Last ned fra bankens portal/e-post som PDF. Hvis i app: Skriv ut til PDF eller ta skjermbilde og konverter.";

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Laster...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-lg rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">
              Last opp finansieringsbevis
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="file">Last opp bevis (PDF/bilde)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{uploadInstructions}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Aksepterer PDF, JPG, PNG. Vi sletter filen etter verifisering.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {verificationStatus === "error" && (
                <p className="text-sm text-destructive mt-2">
                  Hvis opplasting feilet, prøv å konvertere til PDF først eller kontakt support.
                </p>
              )}
            </div>

            <Button
              onClick={handleVerifyAndBid}
              disabled={verificationStatus === "verifying"}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {verificationStatus === "verifying" ? "Verifiserer..." : "Verifiser og send bud"}
            </Button>

            {verificationStatus === "success" && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <CheckCircle className="w-5 h-5 mt-0.5" />
                <div>{apiMessage}</div>
              </div>
            )}

            {verificationStatus === "error" && (
              <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <XCircle className="w-5 h-5 mt-0.5" />
                <div>{apiMessage}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}