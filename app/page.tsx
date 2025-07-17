"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogIn, User } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function Home() {
  const router = useRouter();
  const { signUp, signIn, error: authError } = useSupabaseAuth();
  const [brokerEmail, setBrokerEmail] = useState("");
  const [brokerPassword, setBrokerPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const startAuth = async (role: string) => {
    const state = `${Math.random().toString(36).substring(2)}_${role}`;
    const codeVerifier = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    localStorage.setItem("code_verifier", codeVerifier);

    const codeChallenge = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier))
      .then(buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));

    const authUrl = `https://tefi.sandbox.signicat.com/auth/open/connect/authorize?client_id=${process.env.BANKID_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback&response_type=code&scope=openid&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&acr_values=idp:bid%20level:low`;

    window.location.href = authUrl;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Bidder Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-blue-600 mb-2" />
            <CardTitle className="text-xl">Budgiver</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => startAuth("bidder")} className="w-full max-w-xs">
              <LogIn className="mr-2 h-4 w-4" /> Logg inn med BankID
            </Button>
          </CardContent>
        </Card>

        {/* Broker Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-green-600 mb-2" />
            <CardTitle className="text-xl">Megler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" value={brokerEmail} onChange={(e) => setBrokerEmail(e.target.value)} placeholder="megler@eksempel.no" />
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
              {isSigningUp ? "Registrer" : "Logg inn"}
            </Button>
            <Button variant="link" onClick={() => setIsSigningUp(!isSigningUp)} className="w-full text-sm">
              {isSigningUp ? "Har konto? Logg inn" : "Ny bruker? Registrer deg"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}