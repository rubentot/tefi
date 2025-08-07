"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleBankIDLogin = async () => {
    toast({ title: "BankID login", description: "Sender deg til BankID..." });

    try {
      const result = await signIn("signicat", {
        callbackUrl: "/personal-info",
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

  const handleBrokerLogin = async () => {
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: brokerEmail,
        password: brokerPassword,
      });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bidder Card */}
        <Card className="shadow-xl rounded-xl flex flex-col justify-between h-full">
  <CardHeader>
    <CardTitle className="text-lg text-center">Budgiver (BankID)</CardTitle>
  </CardHeader>
  <CardContent className="flex flex-col justify-between h-full space-y-4">
    {/* Matching spacing */}
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">
        Identifiser deg for å sende bud
      </Label>
      <div className="h-[52px] bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-sm text-gray-500">
        BankID brukes for sikker innlogging
      </div>
    </div>

    <Button className="w-full mt-2" onClick={handleBankIDLogin}>
      Logg inn med BankID
    </Button>
  </CardContent>
</Card>


        {/* Broker Card */}
        <Card className="shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-center">Megler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="megler@example.com"
                value={brokerEmail}
                onChange={(e) => setBrokerEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={brokerPassword}
                onChange={(e) => setBrokerPassword(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-2"
              onClick={handleBrokerLogin}
              disabled={loading}
            >
              {loading ? "Logger inn..." : "Logg inn som megler"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
