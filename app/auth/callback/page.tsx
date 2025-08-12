"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state");
    let role = "bidder";  // Default
    if (state) {
      const [, extractedRole] = state.split("_");
      role = extractedRole || "bidder";
    }

    // Store session with role
    const updatedSession = { role }; // Expand with more data if needed from params
    localStorage.setItem("bankid_session", JSON.stringify(updatedSession));

    // Redirect immediately
    router.push(role === "bidder" ? "/personal-info" : "/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 flex items-center justify-center">
      <Card className="border-blue-200 shadow-lg max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl text-blue-900">Logger inn med BankID...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">Behandler BankID-autentisering...</p>
        </CardContent>
      </Card>
    </div>
  );
}