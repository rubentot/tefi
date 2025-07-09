import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Search } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Finansieringsbekreftelse</h1>
          <p className="text-lg text-gray-600">Sikker og enkel finansieringsbekreftelse for eiendomshandel</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">For budgivere</CardTitle>
              <CardDescription>Bekreft din finansiering med BankID</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/finansiering">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" size="lg">
                  Bekreft finansiering
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-900">For meglere</CardTitle>
              <CardDescription>Verifiser budgivers finansiering</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/verifiser">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" size="lg">
                  Verifiser budgiver
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
