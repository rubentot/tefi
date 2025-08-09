"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

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
  bidAmount?: string; // Added to store bid amount in session
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialNumber, setSocialNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bidAmount, setBidAmount] = useState(""); // New state for bid amount
  const [bidType, setBidType] = useState("consumer");
  const [addSecondBidder, setAddSecondBidder] = useState(false);
  const [secondName, setSecondName] = useState("");
  const [secondEmail, setSecondEmail] = useState("");
  const [secondPhone, setSecondPhone] = useState("");
  const [secondSocialNumber, setSecondSocialNumber] = useState("");
  const [secondAddress, setSecondAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankPhone, setBankPhone] = useState("");
  const [bankContactName, setBankContactName] = useState("");
  const [confirmInfo, setConfirmInfo] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
      if (!parsed?.user) {
        router.push("/"); // Redirect if no user
        return;
      }
      setName(parsed.user.name || "");
      setEmail(parsed.user.email || "");
      setPhone(parsed.user.phone || "");
      setSocialNumber(parsed.user.socialNumber || "");
      setBidAmount(parsed.bidAmount || ""); // Pre-fill bid amount if exists
    } else {
      router.push("/");
    }
  }, [router]);

  const handleProceed = () => {
    if (!confirmInfo) {
      alert("Vennligst bekreft at opplysningene er korrekte.");
      return;
    }
    if (session) {
      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          name,
          email,
          phone,
          socialNumber,
          address,
        },
        bidAmount, // Store the bid amount in the session
        bidType,
        secondBidder: addSecondBidder
          ? { name: secondName, email: secondEmail, phone: secondPhone, socialNumber: secondSocialNumber, address: secondAddress }
          : null,
        bankContact: {
          name: bankContactName,
          phone: bankPhone,
          bank: bankName,
        },
      };
      localStorage.setItem("bankid_session", JSON.stringify(updatedSession));
      console.log("Saved session:", updatedSession);
      setTimeout(() => {
        router.push("/upload");
      }, 100);
    }
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
            <Label>Jeg gir bud som *</Label>
            <RadioGroup value={bidType} onValueChange={setBidType} className="flex flex-col space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consumer" id="consumer" />
                <Label htmlFor="consumer">Forbruker</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business">Ledd i næringsvirksomhet / juridisk person (selskap)</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground mt-2">For mer informasjon, se forklaring.</p>
          </div>
          <div>
            <Label htmlFor="name">Navn</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="socialNumber">Fødselsnummer</Label>
            <Input id="socialNumber" value={socialNumber} onChange={(e) => setSocialNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">E-post</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bidAmount">Budbeløp (kr)</Label>
            <Input id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Skriv inn budbeløp" />
          </div>
          <div className="space-y-4 border-t pt-4">
            <p className="font-medium">Bank Kontakt</p>
            <div>
              <Label htmlFor="bankName">Banknavn</Label>
              <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bankPhone">Bank telefonnummer</Label>
              <Input id="bankPhone" type="tel" value={bankPhone} onChange={(e) => setBankPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bankContactName">Bankkontakt navn</Label>
              <Input id="bankContactName" value={bankContactName} onChange={(e) => setBankContactName(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="addSecond" checked={addSecondBidder} onCheckedChange={(checked) => setAddSecondBidder(!!checked)} />
            <Label htmlFor="addSecond">Legg til budgiver 2</Label>
          </div>
          {addSecondBidder && (
            <div className="space-y-4 border-t pt-4">
              <p className="font-medium">Budgiver 2</p>
              <div>
                <Label htmlFor="secondName">Navn</Label>
                <Input id="secondName" value={secondName} onChange={(e) => setSecondName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="secondSocialNumber">Fødselsnummer</Label>
                <Input id="secondSocialNumber" value={secondSocialNumber} onChange={(e) => setSecondSocialNumber(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="secondEmail">E-post</Label>
                <Input id="secondEmail" type="email" value={secondEmail} onChange={(e) => setSecondEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="secondPhone">Telefonnummer</Label>
                <Input id="secondPhone" type="tel" value={secondPhone} onChange={(e) => setSecondPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="secondAddress">Adresse</Label>
                <Input id="secondAddress" value={secondAddress} onChange={(e) => setSecondAddress(e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox id="confirm" checked={confirmInfo} onCheckedChange={(checked) => setConfirmInfo(!!checked)} />
            <Label htmlFor="confirm">Jeg bekrefter at opplysningene er korrekte</Label>
          </div>
          <Button onClick={handleProceed} className="w-full">Neste</Button>
        </CardContent>
      </Card>
    </div>
  );
}