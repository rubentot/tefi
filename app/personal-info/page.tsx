"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function PersonalInfoPage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<string>("");
  const [realEstateId, setRealEstateId] = useState<string>("property1");
  const [hasSecondBuyer, setHasSecondBuyer] = useState<boolean>(false);
  const [secondBuyerName, setSecondBuyerName] = useState<string>("");
  const [secondBuyerEmail, setSecondBuyerEmail] = useState<string>("");
  const [secondBuyerPhone, setSecondBuyerPhone] = useState<string>("");

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setName(parsed.user?.name || "");
      setEmail(parsed.user?.email || "");
      setPhone(parsed.user?.phone || "");
      setBidAmount(parsed.bidAmount || "");
      setRealEstateId(parsed.realEstateId || "property1");
      setHasSecondBuyer(!!parsed.secondBuyer);
      setSecondBuyerName(parsed.secondBuyer?.name || "");
      setSecondBuyerEmail(parsed.secondBuyer?.email || "");
      setSecondBuyerPhone(parsed.secondBuyer?.phone || "");
    }
  }, []);

  const handleSave = () => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      parsed.user = {
        ...parsed.user,
        name,
        email,
        phone,
      };
      parsed.bidAmount = bidAmount;
      parsed.realEstateId = realEstateId;
      if (hasSecondBuyer) {
        parsed.secondBuyer = {
          name: secondBuyerName,
          email: secondBuyerEmail,
          phone: secondBuyerPhone,
          socialNumber: "", // Optional, can be added if needed
        };
      } else {
        delete parsed.secondBuyer;
      }
      localStorage.setItem("bankid_session", JSON.stringify(parsed));
    }
    router.push("/upload");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Personlig informasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Skriv inn navn" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Skriv inn e-post" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Skriv inn telefon" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Budbeløp (kr)</Label>
            <Input
              id="bidAmount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Skriv inn budbeløp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="realEstateId">Bolig å by på</Label>
            <Select value={realEstateId} onValueChange={setRealEstateId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg bolig" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property1">Enebolig på Majorstuen</SelectItem>
                <SelectItem value="property2">Leilighet på Grünerløkka</SelectItem>
                <SelectItem value="property3">Rekkehus på Bekkestua</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="secondBuyer" checked={hasSecondBuyer} onCheckedChange={(checked) => setHasSecondBuyer(checked as boolean)} />
            <Label htmlFor="secondBuyer">Legg til en medbudgiver</Label>
          </div>
          {hasSecondBuyer && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="secondBuyerName">Navn på medbudgiver</Label>
                <Input
                  id="secondBuyerName"
                  value={secondBuyerName}
                  onChange={(e) => setSecondBuyerName(e.target.value)}
                  placeholder="Skriv inn navn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondBuyerEmail">E-post på medbudgiver</Label>
                <Input
                  id="secondBuyerEmail"
                  type="email"
                  value={secondBuyerEmail}
                  onChange={(e) => setSecondBuyerEmail(e.target.value)}
                  placeholder="Skriv inn e-post"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondBuyerPhone">Telefon på medbudgiver</Label>
                <Input
                  id="secondBuyerPhone"
                  value={secondBuyerPhone}
                  onChange={(e) => setSecondBuyerPhone(e.target.value)}
                  placeholder="Skriv inn telefon"
                />
              </div>
            </div>
          )}
          <Button onClick={handleSave} className="w-full mt-4">
            Lagre og gå til opplasting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}