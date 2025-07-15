"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserSession {
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
    address?: string;
  };
  accessToken: string;
  loginTime: number;
  bidType?: string;
  secondBidder?: {
    name: string;
    email: string;
    phone: string;
    socialNumber: string;
    address?: string;
  };
}

interface Bank {
  contactPerson: string;
  phone: string;
  bankName: string;
}

export default function BidFormPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [acceptanceDeadline, setAcceptanceDeadline] = useState("");
  const [reservations, setReservations] = useState("");
  const [takeoverDate, setTakeoverDate] = useState("");
  const [financingPlans, setFinancingPlans] = useState<Bank[]>([{ contactPerson: "", phone: "", bankName: "" }]);

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setSession(parsed);
      if (parsed.role !== "bidder") {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const updateBank = (index: number, field: keyof Bank, value: string) => {
    const updated = [...financingPlans];
    updated[index][field] = value;
    setFinancingPlans(updated);
  };

  const handleBack = () => {
    router.push("/personal-info");
  };

  const handleProceed = () => {
    if (session) {
      const updatedSession = {
        ...session,
        bidAmount,
        acceptanceDeadline,
        reservations,
        takeoverDate,
        financingPlans,
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
          <CardTitle>Gi Bud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bidAmount">Beløp *</Label>
            <Input id="bidAmount" placeholder="For eksempel '2 550 000'" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="acceptanceDeadline">Akseptfrist *</Label>
            <Input id="acceptanceDeadline" placeholder="Du bør ikke sette en kortere akseptfrist enn at megler har mulighet til å underrette selger, budgivere og øvrige interessenter om bud og forbehold." value={acceptanceDeadline} onChange={(e) => setAcceptanceDeadline(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reservations">Eventuelle forbehold (valgfritt)</Label>
            <Textarea id="reservations" placeholder="Eventuelle forbehold er en av budet og vil videreførmidlet til selger/øvrige budgivere og interessenter." value={reservations} onChange={(e) => setReservations(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="takeoverDate">Ønsket overtagelse *</Label>
            <Input id="takeoverDate" placeholder="Oppgi når du ønsker å overta eiendommen, for eksempel '10. mars 2019'" value={takeoverDate} onChange={(e) => setTakeoverDate(e.target.value)} />
          </div>
          <div>
            <Label>Finansieringsplan</Label>
            {financingPlans.map((bank, index) => (
              <div key={index} className="space-y-2 mt-4 border-t pt-4">
                <p className="font-medium">Bank {index + 1}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`contact-${index}`}>Kontaktperson *</Label>
                    <Input id={`contact-${index}`} value={bank.contactPerson} onChange={(e) => updateBank(index, "contactPerson", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${index}`}>Telefon *</Label>
                    <Input id={`phone-${index}`} value={bank.phone} onChange={(e) => updateBank(index, "phone", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`bank-${index}`}>Banknavn (Valgfritt)</Label>
                    <Input id={`bank-${index}`} value={bank.bankName} onChange={(e) => updateBank(index, "bankName", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleBack}>Tilbake</Button>
            <Button onClick={handleProceed}>Gå videre</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}