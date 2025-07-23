"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/lib/supabase-client";

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ BankID Login (NextAuth Signicat)
 const handleBankIDLogin = async () => {
  console.log("BankID button clicked"); // ✅
  try {
    toast({ title: "BankID", description: "Sender deg til BankID..." });
    await signIn("signicat", { callbackUrl: "/dashboard" });
  } catch (err) {
    console.error("BankID login error:", err);
    toast({
      title: "Feil",
      description: "Kunne ikke starte BankID login.",
      variant: "destructive",
    });
  }
};

  // ✅ Broker Login (Supabase)
  const handleBrokerLogin = async () => {
    if (!brokerEmail || !brokerPassword) {
      toast({ title: "Feil", description: "Fyll ut e-post og passord.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: brokerEmail,
      password: brokerPassword,
    });

    if (error) {
      console.error("Supabase login error:", error);
      toast({ title: "Innlogging feilet", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const user = data.session?.user;

    if (!user || user.user_metadata.role !== "broker") {
      await supabaseClient.auth.signOut();
      toast({
        title: "Ingen tilgang",
        description: "Denne brukeren er ikke registrert som megler.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    localStorage.setItem(
      "bankid_session",
      JSON.stringify({
        role: "broker",
        user: {
          id: user.id,
          name: user.user_metadata.name || user.email?.split("@")[0],
          email: user.email,
        },
        accessToken: data.session.access_token,
        loginTime: Date.now(),
      })
    );

    toast({ title: "Innlogging vellykket", description: "Logger inn som megler..." });
    window.location.href = "/verifiser";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex justify-center items-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Velkommen til Tefi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ✅ Bidder Login */}
          <Button className="w-full" onClick={handleBankIDLogin}>
            Logg inn med BankID
          </Button>

          {/* ✅ Broker Login */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 text-center mb-4">Megler login</p>
            <Label>E-post</Label>
            <Input
              type="email"
              value={brokerEmail}
              onChange={(e) => setBrokerEmail(e.target.value)}
            />
            <Label>Passord</Label>
            <Input
              type="password"
              value={brokerPassword}
              onChange={(e) => setBrokerPassword(e.target.value)}
            />
            <Button
              className="w-full mt-4"
              onClick={handleBrokerLogin}
              disabled={loading}
            >
              {loading ? "Logger inn..." : "Logg inn som megler"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
