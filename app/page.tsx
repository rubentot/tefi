"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn as nextAuthSignIn } from "next-auth/react"; // For Signicat/BankID login
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"; // Assuming the hook path

export default function HomePage() {
  const router = useRouter();
  const { signIn, error } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleBidderLogin = async () => {
    // Start Signicat authentication process for BankID and redirect to dashboard on success
    await nextAuthSignIn("signicat", { callbackUrl: "/dashboard" });
  };

  const handleBrokerLogin = async () => {
    if (!email || !password) return;
    const data = await signIn(email, password);
    if (data) {
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } else {
      setLoginError(error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Bidder Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Logg inn som budgiver</CardTitle>
            <CardDescription>Bruk BankID for sikker innlogging.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add any additional info or icons if needed */}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleBidderLogin}>
              Logg inn med BankID
            </Button>
          </CardFooter>
        </Card>

        {/* Broker Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Logg inn som megler</CardTitle>
            <CardDescription>Bruk e-post og passord for innlogging.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add any additional info or icons if needed */}
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Logg inn</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Megler innlogging</DialogTitle>
                  <DialogDescription>Skriv inn dine opplysninger for å logge inn.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-post</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="password">Passord</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  {loginError && <p className="text-sm text-red-600">{loginError}</p>}
                </div>
                <DialogFooter>
                  <Button onClick={handleBrokerLogin}>Logg inn</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}