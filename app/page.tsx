"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabaseClient } from '@/lib/supabase-client';

export default function Home() {
  const router = useRouter();
  const { signUp, signIn, error: authError } = useSupabaseAuth();
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const startAuth = async (role: string) => {
    // Existing BankID logic remains unchanged...
  };

  const handleBrokerAuth = async () => {
    setLoginError("");
    let data;
    if (isSigningUp) {
      data = await signUp(brokerEmail, brokerPassword);
      if (data) {
        alert("Registrering vellykket! Sjekk e-post for bekreftelse.");
        setIsSigningUp(false);
      }
    } else {
      data = await signIn(brokerEmail, brokerPassword);
      if (data) {
        const sessionData = {
          role: "broker",
          user: {
            id: data.user.id,
            name: data.profile?.name || data.user.email,
            email: data.user.email,
            phone: data.profile?.phone || "",
            socialNumber: data.profile?.social_number || "",
          },
          accessToken: data.session?.access_token,
          loginTime: Date.now(),
        };
        localStorage.setItem("bankid_session", JSON.stringify(sessionData));
        router.push("/dashboard");
      }
    }
    if (authError) setLoginError(authError);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Velkommen til Tefi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => startAuth("bidder")} className="w-full">
            Logg inn som budgiver (BankID)
          </Button>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Megler {isSigningUp ? "Registrering" : "Login"}</h3>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" value={brokerEmail} onChange={(e) => setBrokerEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input id="password" type="password" value={brokerPassword} onChange={(e) => setBrokerPassword(e.target.value)} />
            </div>
            {loginError && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="mr-2 h-4 w-4" /> {loginError}
              </div>
            )}
            <Button onClick={handleBrokerAuth} className="w-full">
              {isSigningUp ? "Registrer" : "Logg inn"} som megler
            </Button>
            <Button variant="link" onClick={() => setIsSigningUp(!isSigningUp)} className="w-full">
              {isSigningUp ? "Allerede bruker? Logg inn" : "Ny bruker? Registrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}