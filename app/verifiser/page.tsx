"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, RotateCcw } from "lucide-react";

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

interface Bid {
  id: string;
  user_id: string;
  bid_amount: number;
  reference_code: string;
  expiration: Date;
  approved: boolean | null;
  status: "ok" | "ikke ok";
  bidder_info: {
    name: string;
    email: string;
    phone: string;
  } | null;
  real_estate_id: string;
  bank_contact_name: string;
  bank_phone: string;
  bank_name: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [realEstateId, setRealEstateId] = useState("property1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem("bankid_session");
    if (sessionData) {
      const parsed = JSON.parse(sessionData) as UserSession;
      setSession(parsed);
      if (parsed.role !== "broker") {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bids?realEstateId=${realEstateId}`);
        if (!res.ok) {
          const text = await res.text();
          console.error(`HTTP error! status: ${res.status}, response: ${text}`);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("Fetched bids data:", data);
        if (data.error) throw new Error(data.error);
        setBids(data.bids || []);
      } catch (error) {
        console.error("Failed to fetch bids:", error);
        setBids([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, [realEstateId]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bids?realEstateId=${realEstateId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`HTTP error! status: ${res.status}, response: ${text}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Refresh data:", data);
      if (data.error) throw new Error(data.error);
      setBids(data.bids || []);
    } catch (error) {
      console.error("Refresh failed:", error);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBids([]);
    console.log("Dashboard tilbakestilt");
  };

  if (!session || session.role !== "broker") {
    return <div className="min-h-screen flex items-center justify-center">Laster... eller uautorisert...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-6">
      <Card className="max-w-6xl mx-auto shadow-lg rounded-lg border border-gray-200">
        <CardHeader className="flex flex-row justify-between items-center bg-blue-50 p-6 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-gray-800">Tefi</CardTitle>
          <div className="space-x-4">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="text-blue-600 hover:text-blue-800">
              <RefreshCw className="mr-2 h-5 w-5" /> Oppdater
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="text-red-600 hover:text-red-800">
              <RotateCcw className="mr-2 h-5 w-5" /> Tilbakestill
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Alle budgivere</h3>
            {loading ? (
              <div className="text-center text-gray-500">Laster bud...</div>
            ) : (
              <Table className="min-w-full bg-white shadow-md rounded-lg">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Navn</TableHead>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">E-post</TableHead>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Telefon</TableHead>
                    {/* Removed Kode column */}
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Status</TableHead>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Bankkontakt Navn</TableHead>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Bank Telefon</TableHead>
                    <TableHead className="py-3 px-4 text-left text-gray-600 font-medium">Bank Navn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id} className="hover:bg-gray-50">
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bidder_info?.name || "Ukjent"}</TableCell>
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bidder_info?.email || "ukjent@example.com"}</TableCell>
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bidder_info?.phone || "N/A"}</TableCell>
                      {/* Removed Kode cell */}
                      <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                        {bid.status.toUpperCase()}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bank_contact_name}</TableCell>
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bank_phone}</TableCell>
                      <TableCell className="py-3 px-4 text-gray-800">{bid.bank_name}</TableCell>
                    </TableRow>
                  ))}
                  {bids.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-4 text-center text-gray-500">
                        Ingen aktive budgivere ennå.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}