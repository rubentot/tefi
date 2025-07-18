"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const { data: sessionData, status } = useSession();
  const router = useRouter();
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state");
    let role = "bidder";  // Default
    if (state) {
      const [, extractedRole] = state.split("_");
      role = extractedRole || "bidder";
    }

    if (status === "authenticated" && sessionData?.user) {
      const updatedSession = {
        ...sessionData,
        user: {
          ...sessionData.user,
          role,  // Add role to user
        },
      };
      localStorage.setItem("bankid_session", JSON.stringify(updatedSession));
      router.push(role === "bidder" ? "/bid-form" : "/dashboard");
    } 
    // Removed unauthenticated redirect to avoid loop; if no session after loading, show error instead
    else if (status === "loading") {
      // Wait for session to load
      const timeout = setTimeout(() => {
        if (statusRef.current !== "authenticated") {
          router.push("/"); // Fallback if session fails to load
        }
      }, 5000); // 5s timeout to prevent infinite wait
      return () => clearTimeout(timeout);
    }
  }, [status, sessionData, router]);

  if (status === "loading") {
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

  return null;  // Or error UI if needed
}