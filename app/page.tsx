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
 // ✅ BankID Login (NextAuth Signicat)
const handleBankIDLogin = async () => {
  console.log("✅ BankID login button clicked");
  toast({ title: "BankID login", description: "Sender deg til BankID..." });

  try {
    const result = await signIn("signicat", {
      callbackUrl: "/personal-info", // ✅ Redirect bidders here
      redirect: true,
    });
    console.log("BankID signIn result:", result);
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
    console.log("✅ Broker login button clicked");
    if (!brokerEmail || !brokerPassword) {
      toast({
        title: "Feil",
        description: "Fyll ut e-post og passord.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Logging in broker with:", brokerEmail);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: brokerEmail,
        password: brokerPassword,
      });

      console.log("Supabase broker login result:", data, error);

      if (error) {
        toast({
          title: "Innlogging feilet",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const user = data.session?.user;

      if (!user || user.user_metadata.role !== "broker") {
        console.warn("Not a broker or missing role metadata", user);
        await supabaseClient.auth.signOut();
        toast({
          title: "Ingen tilgang",
          description: "Denne brukeren er ikke registrert som megler.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("✅ Broker authenticated:", user);

      // ✅ Save to localStorage (instant redirect)
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

      toast({
        title: "Innlogging vellykket",
        description: "Logger inn som megler...",
      });
      window.location.href = "/verifiser";
    } catch (err) {
      console.error("Unexpected broker login error:", err);
    } finally {
      setLoading(false);
    }
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

          {/* ✅ Broker Login */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              Megler login
            </p>
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

              <Button
                className="w-full mt-4"
                onClick={handleBrokerLogin}
                disabled={loading}
              >
                {loading ? "Logger inn..." : "Logg inn som megler"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
