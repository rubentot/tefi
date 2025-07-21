"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/lib/supabase-client"; // ✅ Make sure this exists

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();

  // ✅ State for broker login
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Placeholder for BankID (implement NextAuth later)
  const handleBankIDLogin = async () => {
    toast({ title: "BankID login", description: "Redirecting to BankID..." });
    // Implement NextAuth Signicat here
    router.push("/dashboard");
  };

  // ✅ Broker Login
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

    // ✅ Save session to localStorage for instant redirect later
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
    window.location.href = "/verifiser"; // ✅ Hard redirect to ensure it works on Vercel
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex justify-center items-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Velkommen til Tefi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ✅ Bidder Login */}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleBankIDLogin}>
              Logg inn med BankID
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 text-center mb-4">Megler login</p>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="megler@example.com"
                value={brokerEmail}
                onChange={(e) => setBrokerEmail(e.target.value)}
              />

              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={brokerPassword}
                onChange={(e) => setBrokerPassword(e.target.value)}
              />

              <Button className="w-full mt-4" onClick={handleBrokerLogin} disabled={loading}>
                {loading ? "Logger inn..." : "Logg inn som megler"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
