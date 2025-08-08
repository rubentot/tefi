"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCcw } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";

const propertyMap: Record<string, { name: string; address: string }> = {
  property1: { name: "Enebolig på Majorstuen", address: "Majorstuveien 1, 0367 Oslo" },
  property2: { name: "Leilighet på Grünerløkka", address: "Thorvald Meyers gate 30, 0555 Oslo" },
  property3: { name: "Rekkehus på Bekkestua", address: "Bekkestuveien 15, 1357 Bekkestua" },
};

interface UserSession {
  role: "broker";
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  accessToken: string;
  loginTime: number;
}

interface Bid {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bidAmount: number;
  realEstateId: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const stored = localStorage.getItem("bankid_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === "broker") {
          setSession(parsed);
          return;
        }
      }
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session || data.session.user.user_metadata.role !== "broker") {
        window.location.href = "/";
        return;
      }
      const user = data.session.user;
      setSession({
        role: "broker",
        user: {
          id: user.id,
          name: user.user_metadata.name || user.email?.split("@")[0],
          email: user.email,
        },
        accessToken: data.session.access_token,
        loginTime: Date.now(),
      });
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (session?.role === "broker") {
      fetchBids();
    }
  }, [session]);

  const fetchBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabaseClient
        .from("bids")
        .select(
          `
          id,
          user_id,
          bid_amount,
          real_estate_id,
          profiles (
            name,
            email,
            phone
          )
        `
        )
        .order("id", { ascending: false });

      if (error) throw error;

      const mapped = data.map((b: any) => ({
        id: b.id,
        userId: b.user_id,
        name: b.profiles?.name || "Ukjent",
        email: b.profiles?.email || "-",
        phone: b.profiles?.phone || "-",
        bidAmount: b.bid_amount,
        realEstateId: b.real_estate_id,
      }));

      setBids(mapped);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed to fetch bids:", err);
      setError(`Kunne ikke hente bud: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchBids();
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabaseClient.from("bids").delete().eq("id", id);
      if (error) throw error;
      setBids((prev) => prev.filter((bid) => bid.id !== id));
      console.log("Bid deleted:", id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed to delete bid:", err);
      setError(`Kunne ikke slette bud: ${errorMessage}`);
    }
  };

  const isBidValid = (bid: Bid) => true; // Validation handled by upload page

  // Group bids by property
  const groupedBids: Record<string, Bid[]> = {};
  bids.forEach((bid) => {
    if (!groupedBids[bid.realEstateId]) groupedBids[bid.realEstateId] = [];
    groupedBids[bid.realEstateId].push(bid);
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Laster inn bud...
      </div>
    );

  if (!session)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Ingen tilgang
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Megler Dashboard – Budoversikt</CardTitle>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Oppdater
          </Button>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {bids.length === 0 ? (
            <p className="text-center">Ingen aktive bud enda.</p>
          ) : (
            Object.entries(groupedBids).map(([propertyId, propertyBids]) => (
              <div key={propertyId} className="mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {propertyMap[propertyId]?.name || propertyId} - {propertyMap[propertyId]?.address || "Ukjent adresse"}
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Bud (kr)</TableHead>
                      <TableHead>Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyBids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>{bid.name}</TableCell>
                        <TableCell>{bid.email}</TableCell>
                        <TableCell>{bid.phone}</TableCell>
                        <TableCell>{bid.bidAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(bid.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}