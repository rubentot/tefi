"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, MapPin, Euro, User, LogOut, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

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

export default function PropertyListPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    )
  }

  const properties = [
    {
      id: "3837340",
      address: "Eidsnesvegen 2",
      postalCode: "6953",
      city: "Leirvik i Sogn",
      price: "kr 890 000",
      image: "/placeholder.svg?height=200&width=300",
      type: "Enebolig",
      size: "120 m²",
      rooms: "4 rom",
      year: "1995",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tefi
                </h1>
                <p className="text-gray-600 text-sm">Tilgjengelige eiendommer</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Velkommen, {session?.user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 border-gray-300 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logg ut
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Søk etter adresse, postnummer eller sted..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg border-gray-300 focus:border-blue-500"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 border-gray-300 bg-transparent">
              <Filter className="w-5 h-5 mr-2" />
              Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* Property Listings */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Eiendommer du kan by på</h2>
          <p className="text-gray-600 text-lg">
            Du er logget inn som budgiver og kan nå gi bud på tilgjengelige eiendommer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                <Building className="w-16 h-16 text-gray-400" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  {property.type}
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-gray-900 flex items-center group-hover:text-blue-600 transition-colors">
                  <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                  {property.address}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {property.postalCode} {property.city}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-green-600">
                    <Euro className="w-6 h-6 mr-1" />
                    <span className="text-2xl font-bold">{property.price}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6 text-sm text-gray-600">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{property.size}</div>
                    <div>Størrelse</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{property.rooms}</div>
                    <div>Rom</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{property.year}</div>
                    <div>Byggeår</div>
                  </div>
                </div>

                <Link href={`/eiendom/${property.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Gi bud på denne eiendommen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
