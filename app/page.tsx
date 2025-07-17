"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, User, Key } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8 flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-indigo-900">Tefi</h1>
        <p className="text-xl text-indigo-700">Sikker elektronisk budgivning og finansieringsbekreftelse</p>
        <p className="text-lg text-indigo-600">Logg inn med BankID for å starte budprosessen på eiendom</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Budgiver Card */}
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-200 text-center pb-4">
            <User className="mx-auto h-12 w-12 text-green-600 mb-2" />
            <CardTitle className="text-xl text-green-800">Jeg er budgiver</CardTitle>
            <p className="text-sm text-green-700">Gi bud på eiendom og bekreft finansiering trygt med BankID</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Elektronisk budgivning</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> BankID-autentisering</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Automatisk utfylling av persondata</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Sikker budprosess</li>
            </ul>
            <Button onClick={() => startAuth("bidder")} className="w-full bg-green-600 hover:bg-green-700">
              Logg inn med BankID
            </Button>
          </CardContent>
        </Card>

        {/* Megler Card */}
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 text-center pb-4">
            <Key className="mx-auto h-12 w-12 text-blue-600 mb-2" />
            <CardTitle className="text-xl text-blue-800">Jeg er megler</CardTitle>
            <p className="text-sm text-blue-700">Verifiser budgivere, finansiering og administrer budprosess</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" /> Verifiser budgivers koder</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" /> Se finansieringsbekreftelser</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" /> Kontroller dokumentasjon</li>
              <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" /> Administrer budprosess</li>
            </ul>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" value={brokerEmail} onChange={(e) => setBrokerEmail(e.target.value)} placeholder="megler@eksempel.no" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passord</Label>
                <Input id="password" type="password" value={brokerPassword} onChange={(e) => setBrokerPassword(e.target.value)} placeholder="********" />
              </div>
              {loginError && (
                <div className="flex items-center text-red-600 text-sm bg-red-50 p-2 rounded">
                  <AlertCircle className="mr-2 h-4 w-4" /> {loginError}
                </div>
              )}
              <Button onClick={handleBrokerAuth} className="w-full bg-blue-600 hover:bg-blue-700">
                {isSigningUp ? "Registrer" : "Logg inn"}
              </Button>
              <Button variant="link" onClick={() => setIsSigningUp(!isSigningUp)} className="w-full text-blue-600">
                {isSigningUp ? "Har konto? Logg inn" : "Ny bruker? Registrer deg"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-indigo-600 mt-8 flex items-center">
        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.416-1.416l-.001-.001-3-3z"/>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a1 1 0 100-2 1 1 0 000 2zm0 12a1 1 0 100 2 1 1 0 000-2zm-6-3a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd"/>
        </svg>
        Velg din rolle for å fortsette
      </p>
    </div>
  );
}