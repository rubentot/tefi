"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";

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
  bidAmount?: string;
  bankContact?: {
    name: string;
    phone: string;
    bank: string;
  };
  consents?: {
    gdpr: boolean;
    psd2: boolean;
    dataSharing: boolean;
  };
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialNumber, setSocialNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bidAmount, setBidAmount] = useState("");
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
  const [gdprConsent, setGdprConsent] = useState(false);
  const [psd2Consent, setPsd2Consent] = useState(false);
  const [dataSharingConsent, setDataSharingConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

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
      setBidAmount(parsed.bidAmount || "");
      setGdprConsent(parsed.consents?.gdpr || false);
      setPsd2Consent(parsed.consents?.psd2 || false);
      setDataSharingConsent(parsed.consents?.dataSharing || false);
      if (!parsed.consents || !parsed.consents.gdpr || !parsed.consents.dataSharing) {
        setShowConsentModal(true);
      }
    } else {
      router.push("/");
    }
  }, [router]);

  const handleProceed = () => {
    if (!confirmInfo) {
      alert("Vennligst bekreft at opplysningene er korrekte.");
      return;
    }
    if (!gdprConsent || !dataSharingConsent) {
      alert("Vennligst gi samtykke til data behandling og deling med megler.");
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert("Vennligst skriv inn et gyldig budbeløp.");
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
        bidAmount,
        bidType,
        secondBidder: addSecondBidder ? { name: secondName, email: secondEmail, phone: secondPhone, socialNumber: secondSocialNumber, address: secondAddress } : null,
        bankContact: {
          name: bankContactName,
          phone: bankPhone,
          bank: bankName,
        },
        consents: {
          gdpr: gdprConsent,
          psd2: psd2Consent,
          dataSharing: dataSharingConsent,
        },
      };
      localStorage.setItem("bankid_session", JSON.stringify(updatedSession));
      console.log("Saved session with consents:", updatedSession);
      setTimeout(() => {
        router.push("/upload");
      }, 100);
    }
  };

  const handleAcceptConsents = () => {
    if (!gdprConsent || !dataSharingConsent) {
      alert("Vennligst godta alle obligatoriske samtykker.");
      return;
    }
    setShowConsentModal(false);
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Laster...</div>;
  }

  <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Samtykke til databehandling</DialogTitle>
      <DialogDescription>
        For å bruke Tefi må du gi eksplisitt samtykke til:
        <ul className="list-disc ml-6 mt-2 text-sm">
          <li>
            <b>GDPR:</b> Jeg tillater Tefi å behandle mitt finansieringsbevis for å verifisere om budet er dekket, og dele kun en ja/nei-bekreftelse med megler.
          </li>
          <li>
            <b>PSD2:</b> Jeg samtykker til at Tefi kan hente finansieringsstatus direkte fra min bank via BankID/PSD2 for budbekreftelse.
          </li>
          <li>
            <b>Datadeling:</b> Jeg samtykker til at Tefi deler kun en ja/nei-bekreftelse av mitt bud med ansvarlig megler for denne eiendommen.
          </li>
        </ul>
        <span className="text-xs text-gray-500 block mt-2">
          Samtykket logges med BankID og kan trekkes tilbake via din profil. All dokumentdata krypteres og slettes etter verifisering.
        </span>
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-2 mt-4">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="gdprConsent"
          checked={gdprConsent}
          onCheckedChange={(checked) => setGdprConsent(!!checked)}
        />
        <Label htmlFor="gdprConsent" className="text-sm">GDPR-samtykke</Label>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox
          id="psd2Consent"
          checked={psd2Consent}
          onCheckedChange={(checked) => setPsd2Consent(!!checked)}
        />
        <Label htmlFor="psd2Consent" className="text-sm">PSD2-samtykke</Label>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox
          id="dataSharingConsent"
          checked={dataSharingConsent}
          onCheckedChange={(checked) => setDataSharingConsent(!!checked)}
        />
        <Label htmlFor="dataSharingConsent" className="text-sm">Samtykke til datadeling med megler</Label>
      </div>
    </div>
    <DialogFooter>
      <Button
        onClick={() => {
          if (!gdprConsent || !psd2Consent || !dataSharingConsent) {
            alert("Du må gi samtykke til alle punkter for å fortsette.");
            return;
          }
          setShowConsentModal(false);
        }}
        className="w-full"
      >
        Jeg samtykker og fortsetter
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center max-w-4xl">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">Tefi</span>
              <span className="text-sm text-gray-600">Budgivning</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Lock className="h-5 w-5 text-blue-600" /></TooltipTrigger>
              <TooltipContent>
                <p>Sikret med BankID</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
            <CardHeader className="bg-blue-50 p-6">
              <CardTitle className="text-2xl font-semibold text-gray-800">Dine opplysninger</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Fyll inn detaljene for å fortsette med budgivning.</p>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium text-gray-700">Budtype</h3>
                <RadioGroup value={bidType} onValueChange={setBidType} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="consumer" id="consumer" />
                    <Label htmlFor="consumer" className="text-sm text-gray-700">Forbruker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="text-sm text-gray-700">Ledd i næringsvirksomhet / juridisk person (selskap)</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500">For mer informasjon, se <a href="#" className="underline text-blue-600 hover:text-blue-700">forklaring</a>.</p>
              </section>

              <section className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-gray-700">Navn</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                </div>
                <div>
                  <Label htmlFor="socialNumber" className="text-sm text-gray-700">Fødselsnummer <Tooltip><TooltipTrigger><span className="text-blue-600">?</span></TooltipTrigger><TooltipContent><p>11 siffer, f.eks. 01010012345</p></TooltipContent></Tooltip></Label>
                  <Input id="socialNumber" value={socialNumber} onChange={(e) => setSocialNumber(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700">E-post</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm text-gray-700">Telefonnummer</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                </div>
              </section>

              <section className="space-y-4 md:col-span-2">
                <Label htmlFor="address" className="text-sm text-gray-700">Adresse</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
              </section>

              <section className="space-y-4 md:col-span-2">
                <Label htmlFor="bidAmount" className="text-sm text-gray-700">Budbeløp (kr)</Label>
                <Input id="bidAmount" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Skriv inn budbeløp" className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
              </section>

              <section className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium text-gray-700">Bank Kontakt</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bankName" className="text-sm text-gray-700">Banknavn</Label>
                    <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="bankPhone" className="text-sm text-gray-700">Bank telefonnummer</Label>
                    <Input id="bankPhone" type="tel" value={bankPhone} onChange={(e) => setBankPhone(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                  </div>
                  <div>
                    <Label htmlFor="bankContactName" className="text-sm text-gray-700">Bankkontakt navn</Label>
                    <Input id="bankContactName" value={bankContactName} onChange={(e) => setBankContactName(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                  </div>
                </div>
              </section>

              <Accordion type="single" collapsible className="md:col-span-2">
                <AccordionItem value="second-bidder">
                  <AccordionTrigger className="text-sm font-medium text-gray-700">Legg til budgiver 2</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="secondName" className="text-sm text-gray-700">Navn</Label>
                      <Input id="secondName" value={secondName} onChange={(e) => setSecondName(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="secondSocialNumber" className="text-sm text-gray-700">Fødselsnummer</Label>
                      <Input id="secondSocialNumber" value={secondSocialNumber} onChange={(e) => setSecondSocialNumber(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="secondEmail" className="text-sm text-gray-700">E-post</Label>
                      <Input id="secondEmail" type="email" value={secondEmail} onChange={(e) => setSecondEmail(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                    </div>
                    <div>
                      <Label htmlFor="secondPhone" className="text-sm text-gray-700">Telefonnummer</Label>
                      <Input id="secondPhone" type="tel" value={secondPhone} onChange={(e) => setSecondPhone(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="secondAddress" className="text-sm text-gray-700">Adresse</Label>
                      <Input id="secondAddress" value={secondAddress} onChange={(e) => setSecondAddress(e.target.value)} className="mt-1 text-sm border-gray-300 focus:border-blue-600 focus:ring-blue-600" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox id="confirm" checked={confirmInfo} onCheckedChange={(checked) => setConfirmInfo(!!checked)} />
                <Label htmlFor="confirm" className="text-sm text-gray-700">Jeg bekrefter at opplysningene er korrekte</Label>
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleProceed} className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm py-2 mt-4 transition duration-200">
                  Neste
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="bg-white p-4 text-center text-sm text-gray-500 shadow-inner">
          <p>Support: <a href="mailto:support@tefi.no" className="text-blue-600 hover:text-blue-700">support@tefi.no</a> | © 2025 Tefi AS</p>
        </footer>
      </div>
    </TooltipProvider>
  );
}