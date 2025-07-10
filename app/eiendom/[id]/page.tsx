"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Euro, Shield, Building, User, LogOut } from "lucide-react"
import Link from "next/link"

interface UserSession {
  role: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    socialNumber: string
  }
  accessToken: string
  loginTime: number
}

export default function PropertyBiddingPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [bidderType, setBidderType] = useState("forbruker")
  const [wantFinancing, setWantFinancing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    bidAmount: "",
    acceptanceDeadline: "",
    conditions: "",
    desiredTakeover: "",
    bankName: "",
    contactPerson: "",
    loanAmount: "",
  })

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session")
    if (!sessionData) {
      window.location.href = "/"
      return
    }

    try {
      const parsedSession = JSON.parse(sessionData)
      if (parsedSession.role !== "bidder") {
        window.location.href = "/"
        return
      }

      // Pre-populate form with user data from BankID
      const [firstName, ...lastNameParts] = parsedSession.user.name.split(" ")
      setFormData({
        firstName: firstName || "",
        lastName: lastNameParts.join(" ") || "",
        email: parsedSession.user.email || "",
        phone: parsedSession.user.phone || "",
        address: "",
        postalCode: "",
        city: "",
        bidAmount: "",
        acceptanceDeadline: "",
        conditions: "",
        desiredTakeover: "",
        bankName: "",
        contactPerson: "",
        loanAmount: "",
      })

      setSession(parsedSession)
    } catch (err) {
      console.error("Invalid session data")
      window.location.href = "/"
      return
    }

    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("bankid_session")
    window.location.href = "/"
  }

  // ... rest of the component logic remains the same ...

  const property = {
    address: "Eidsnesvegen 2",
    postalCode: "6953",
    city: "Leirvik i Sogn",
    price: "kr 890 000",
  }

  const steps = ["Personlige opplysninger", "Kontroller informasjon", "Budinformasjon", "Bekreft bud", "Bud signert"]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinancingRedirect = () => {
    // Redirect to our financing verification system
    window.location.href = "/finansiering"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-900">Elektronisk budgivning</h1>
              <p className="text-sm text-gray-600">en tjeneste levert av Tefi</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">{session?.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logg ut
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same as before... */}
      {/* Property Info, Progress Steps, and all the form steps */}

      {/* Property Info */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Building className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{property.address}</h2>
              <p className="text-blue-100">
                {property.postalCode} {property.city}
              </p>
              <p className="text-3xl font-bold mt-2">{property.price}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-4 text-blue-600 border-white hover:bg-white bg-transparent">
            Vis mer informasjon om eiendommen →
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center space-x-2 ${
                    index + 1 === currentStep
                      ? "text-blue-600 font-semibold"
                      : index + 1 < currentStep
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      index + 1 === currentStep
                        ? "bg-blue-600 text-white"
                        : index + 1 < currentStep
                          ? "bg-green-600 text-white"
                          : "bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm hidden md:block">{step}</span>
                </div>
                {index < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - showing just step 1 for brevity, but all steps remain the same */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 flex items-center">
                <User className="w-6 h-6 mr-2" />
                Personlige opplysninger
              </CardTitle>
              <CardDescription>
                Informasjonen er hentet fra BankID. Kontroller at opplysningene er korrekte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information Form - now pre-populated */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Fornavn *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Etternavn *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post adresse *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobilnummer *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postnummer *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Poststed *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-700">
                  Vi gjør oppmerksom på at du ved å fortsette registreringen vil bli registrert som interessent på denne
                  eiendommen.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Gå videre
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900">Kontroller informasjon</CardTitle>
              <CardDescription>Kontroller at all informasjon er korrekt før du går videre.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Budgiver 1 - kontroller informasjon</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Fornavn:</strong> {formData.firstName}
                  </div>
                  <div>
                    <strong>Etternavn:</strong> {formData.lastName}
                  </div>
                  <div>
                    <strong>E-post:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>Mobilnummer:</strong> {formData.phone}
                  </div>
                  <div>
                    <strong>Adresse:</strong> {formData.address}
                  </div>
                  <div>
                    <strong>Postnummer:</strong> {formData.postalCode}
                  </div>
                  <div>
                    <strong>Poststed:</strong> {formData.city}
                  </div>
                  <div>
                    <strong>Jeg gir bud som:</strong> {bidderType === "forbruker" ? "Forbruker" : "Næring"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="company" />
                  <Label htmlFor="company">Ledd i næringsvirksomhet / juridisk person (selskap)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="together" />
                  <Label htmlFor="together">Skal du kjøpe sammen med en annen person?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="behalf" />
                  <Label htmlFor="behalf">Skal du gi bud på vegne av en annen person (fullmakt)?</Label>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Det er kun budgiveren som skal signere det elektroniske budet, men du kan registrere kjøper 2's
                  opplysninger som tas med som informasjon til megler.
                </p>
                <Button variant="outline" className="mt-2 text-blue-600 border-blue-300 bg-transparent">
                  Legg til kjøper 2 / fullmakt
                </Button>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  ← Tilbake
                </Button>
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Gå videre
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 flex items-center">
                <Euro className="w-6 h-6 mr-2" />
                Gi bud
              </CardTitle>
              <CardDescription>Fyll ut budinformasjon og finansieringsplan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bidAmount">Beløp *</Label>
                  <Input
                    id="bidAmount"
                    placeholder="For eksempel '2 550 000'"
                    value={formData.bidAmount}
                    onChange={(e) => handleInputChange("bidAmount", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceptanceDeadline">Akseptfrist *</Label>
                  <Input
                    id="acceptanceDeadline"
                    type="datetime-local"
                    value={formData.acceptanceDeadline}
                    onChange={(e) => handleInputChange("acceptanceDeadline", e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Du bør ikke sette en kortere akseptfrist enn at megler har mulighet til å orientere selger,
                    budgivere og øvrige interessenter om bud og forbehold.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions">Eventuelle forbehold (Valgfritt)</Label>
                <Textarea
                  id="conditions"
                  placeholder="Skriv eventuelle forbehold her"
                  value={formData.conditions}
                  onChange={(e) => handleInputChange("conditions", e.target.value)}
                  className="border-blue-200 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Eventuelle forbehold er en del av budet og vil bli videreformidlet til selger/øvrige budgivere og
                  interessenter.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredTakeover">Ønsket overtagelse *</Label>
                <Input
                  id="desiredTakeover"
                  placeholder="For eksempel '10. mars 2019'"
                  value={formData.desiredTakeover}
                  onChange={(e) => handleInputChange("desiredTakeover", e.target.value)}
                  className="border-blue-200 focus:border-blue-500"
                  required
                />
              </div>

              {/* Financing Plan */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Finansieringsplan
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank 1 *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Kontaktperson</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Lånebeløp kr (Valgfritt)</Label>
                    <Input
                      id="loanAmount"
                      value={formData.loanAmount}
                      onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <Button variant="outline" className="mt-4 text-blue-600 border-blue-300 bg-transparent">
                  + Legg til flere banker
                </Button>
              </div>

              {wantFinancing && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Finansieringsbekreftelse</h4>
                  </div>
                  <p className="text-sm text-green-800 mb-3">
                    For å styrke budet ditt kan du bekrefte din finansiering med BankID og dokumentasjon.
                  </p>
                  <Button onClick={handleFinancingRedirect} className="bg-green-600 hover:bg-green-700 text-white">
                    Bekreft finansiering med BankID →
                  </Button>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  ← Tilbake
                </Button>
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Gå videre
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Bekreft bud
              </CardTitle>
              <CardDescription>Kontroller all informasjon før du bekrefter budet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-lg mb-4">Budsammendrag</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Budet på kr {formData.bidAmount || "0"} er bindende.</strong>
                  </p>
                  <p>
                    <strong>Akseptfrist:</strong> {formData.acceptanceDeadline || "Ikke satt"}
                  </p>
                  <p>
                    <strong>Forbehold:</strong> {formData.conditions || "Ingen"}
                  </p>
                  <p>
                    <strong>Ønsket overtagelse:</strong> {formData.desiredTakeover || "Ikke oppgitt"}
                  </p>
                  <p>
                    <strong>Jeg gir bud som:</strong> {bidderType === "forbruker" ? "Forbruker" : "Næring"}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Etter at ditt bud er registrert i systemet vil megler kvalitetssikre innholdet. Etter at budet er
                  formidlet til selger kan det ikke kalles tilbake.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="readSales" required />
                  <Label htmlFor="readSales" className="text-sm">
                    Jeg har lest salgsoppgaven og forbrukerinformasjon om budgivning
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="confirmInfo" required />
                  <Label htmlFor="confirmInfo" className="text-sm">
                    Jeg bekrefter at budinformasjonen er korrekt
                  </Label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  ← Tilbake
                </Button>
                <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                  Bekreft bud
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 5 && (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">Bud signert</CardTitle>
              <CardDescription>Ditt bud er nå registrert og sendt til megler for behandling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg mb-2">Takk for ditt bud!</h3>
                <p className="text-sm text-green-800">
                  Budet ditt på <strong>kr {formData.bidAmount}</strong> er nå registrert i systemet. Megler vil
                  kvalitetssikre innholdet og formidle budet til selger.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  Du vil motta en bekreftelse på e-post til <strong>{formData.email}</strong>
                </p>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700">Gå til mine bud</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Om elektronisk budgivning</h3>
            <p className="text-sm text-gray-600">
              Tefi er en sikker og enkel nettside for elektronisk budgivning. Med BankID kan eiendomsmegleren
              identifisere deg som budgiver, og du kan levere bud og budforhøyelser helt elektronisk.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="#" className="text-blue-600 hover:underline">
                Slik fungerer tjenesten →
              </Link>
              <Link href="#" className="text-blue-600 hover:underline">
                Forbrukerinformasjon om budgivning →
              </Link>
              <Link href="#" className="text-blue-600 hover:underline">
                Personvernerklæring
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              Tefi er en del av eiendomsmeglerprogramvaren Webmegler - levert av Broker AS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
