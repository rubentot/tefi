"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Upload, Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabaseClient } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";

interface UserSession {
  role: "broker" | "bidder";
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
  const { toast } = useToast();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [maxFinancing, setMaxFinancing] = useState<number | null>(null);
  const [detectedName, setDetectedName] = useState<string>("");
  const isMobile = useIsMobile();

  // ✅ Session Check
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error || !data.session) {
        router.push("/");
        return;
      }

      const user = data.session.user;
      const role = user.user_metadata.role;

      if (role === "broker") {
        router.push("/verifiser");
        return;
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setSession({
        role: "bidder",
        user: {
          id: user.id,
          name: profile?.name || user.email?.split("@")[0] || "Unknown",
          email: user.email ?? "",
          phone: profile?.phone ?? "",
          socialNumber: profile?.social_number ?? "",
        },
        accessToken: data.session.access_token,
        loginTime: Date.now(),
      });
    };

    checkSession();
  }, [router]);

  // ✅ Upload & Verify Finansieringsbevis
  const handleVerifyAndBid = async () => {
    if (!file || !session || !bidAmount) {
      toast({ title: "Manglende data", description: "Last opp dokument og fyll inn budbeløp.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expectedName", session.user.name);
      formData.append("bidAmount", bidAmount);
      formData.append("userId", session.user.id);

      const verifyRes = await fetch("/api/verify-upload", { method: "POST", body: formData });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setReferenceCode(verifyData.referenceCode);
        setMaxFinancing(verifyData.maxFinancing);
        setDetectedName(verifyData.detectedName);

        toast({
          title: "Bud bekreftet!",
          description: `Referansekode: ${verifyData.referenceCode}`,
        });
      } else {
        toast({
          title: "Verifisering feilet",
          description: verifyData.error || "Dokumentet kunne ikke bekreftes.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Bid verification failed:", err);
      toast({
        title: "Feil",
        description: "Noe gikk galt under verifisering.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Logg inn for å fortsette...
      </div>
    );
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
            </div>
            <Button onClick={handleVerifyAndBid} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {loading ? "Verifiserer..." : "Verifiser og send bud"}
            </Button>
            {referenceCode && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2 mt-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 text-green-600" />
                  <p>
                    Verifisert! Referansekode: <strong>{referenceCode}</strong>
                  </p>
                </div>
                <p><strong>Finansiering:</strong> {maxFinancing?.toLocaleString("no-NO")} kr</p>
                <p><strong>Navn funnet i dokument:</strong> {detectedName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
