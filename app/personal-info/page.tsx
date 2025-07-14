// app/personal-info/page.tsx (New page for bidder to fill personal info)
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserSession {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
  };
  accessToken: string;
  loginTime: number;
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialNumber, setSocialNumber] = useState("");

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
      // Pre-fill from BankID session
      setName(parsed.user.name || "");
      setEmail(parsed.user.email || "");
      setPhone(parsed.user.phone || "");
      setSocialNumber(parsed.user.socialNumber || "");
    } else {
      router.push("/");
    }
  }, [router]);

  const handleProceed = () => {
    // Update session with filled info (if changed)
    if (session) {
      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          name,
          email,
          phone,
          socialNumber,
        },
      };
      localStorage.setItem("bankid_session", JSON.stringify(updatedSession));
    }
    router.push("/upload");
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Fyll inn personopplysninger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Navn</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-post</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="socialNumber">Personnummer</Label>
            <Input id="socialNumber" value={socialNumber} onChange={(e) => setSocialNumber(e.target.value)} />
          </div>
          <Button onClick={handleProceed} className="w-full">Fortsett til opplasting</Button>
        </CardContent>
      </Card>
    </div>
  );
}