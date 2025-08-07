"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { updateBidApproval } from "@/lib/bids";

export const dynamic = "force-dynamic";

const propertyMap: Record<string, string> = {
  property1: "Enebolig på Majorstuen",
  property2: "Leilighet på Grünerløkka",
  property3: "Rekkehus på Bekkestua",
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

interface Profile {
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface Bid {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bidAmount: number;
  maxFinancing: number;
  referenceCode: string;
  approved?: boolean;
  realEstateId: string;
}

interface BidResponse {
  id: string;
  user_id: string;
  bid_amount: number;
  max_financing_amount: number;
  reference_code: string;
  approved: boolean | null;
  real_estate_id: string;
  profiles: Profile | null;
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
            max_financing_amount,
            reference_code,
            approved,
            real_estate_id,
            profiles!bids_user_id_fkey (
              name,
              email,
              phone
            )
          `
          )
          .order("id", { ascending: false });

        if (error) throw error;

        const mapped = (data as BidResponse[]).map((b) => ({
          id: b.id,
          userId: b.user_id,
          name: b.profiles?.name || "Ukjent",
          email: b.profiles?.email || "-",
          phone: b.profiles?.phone || "-",
          bidAmount: b.bid_amount,
          maxFinancing: b.max_financing_amount,
          referenceCode: b.reference_code,
          approved: b.approved,
          realEstateId: b.real_estate_id,
        }));

        setBids(mapped);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Failed to fetch bids:", err);
        setError(`Kunne ikke hente bud: ${errorMessage}`);
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.role === "broker") {
      fetchBids();

      // Set up Supabase Realtime subscription
      const channel = supabaseClient
        .channel("bids-channel")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "bids" },
          async (payload) => {
            console.log("New bid inserted:", payload);
            try {
              const { data, error } = await supabaseClient
                .from("bids")
                .select(
                  `
                  id,
                  user_id,
                  bid_amount,
                  max_financing_amount,
                  reference_code,
                  approved,
                  real_estate_id,
                  profiles!bids_user_id_fkey (
                    name,
                    email,
                    phone
                  )
                `
                )
                .eq("id", payload.new.id)
                .single();

              if (error) throw error;

              const newBid: Bid = {
                id: data.id,
                userId: data.user_id,
                name: data.profiles?.name || "Ukjent",
                email: data.profiles?.email || "-",
                phone: data.profiles?.phone || "-",
                bidAmount: data.bid_amount,
                maxFinancing: data.max_financing_amount,
                referenceCode: data.reference_code,
                approved: data.approved,
                realEstateId: data.real_estate_id,
              };

              setBids((prev) => [newBid, ...prev]);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              console.error("Error fetching new bid:", err);
              setError(`Kunne ikke hente nytt bud: ${errorMessage}`);
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [session]);

  const handleApprove = async (referenceCode: string, approved: boolean) => {
    try {
      await updateBidApproval(referenceCode, approved);
      setBids((prev) =>
        prev.map((bid) =>
          bid.referenceCode === referenceCode ? { ...bid, approved } : bid
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Approval update failed:", err);
      setError(`Kunne ikke oppdatere budstatus: ${errorMessage}`);
    }
  };

  const isBidValid = (bid: Bid) => bid.bidAmount <= bid.maxFinancing;

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
        <CardHeader>
          <CardTitle>Megler Dashboard – Budoversikt</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {bids.length === 0 ? (
            <p className="text-center">Ingen aktive bud enda.</p>
          ) : (
            Object.entries(groupedBids).map(([propertyId, propertyBids]) => (
              <div key={propertyId} className="mb-10">
                <h2 className="text-xl font-bold mb-2">
                  {propertyMap[propertyId] || propertyId}
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>E-post</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Bud (kr)</TableHead>
                      <TableHead>Finansiering (kr)</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Status</TableHead>
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
                        <TableCell>{bid.maxFinancing.toLocaleString()}</TableCell>
                        <TableCell>{bid.referenceCode}</TableCell>
                        <TableCell>
                          {bid.approved === true ? (
                            <span className="text-green-600 font-semibold">
                              Godkjent
                            </span>
                          ) : bid.approved === false ? (
                            <span className="text-red-600 font-semibold">
                              Avvist
                            </span>
                          ) : isBidValid(bid) ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="mr-1 h-4 w-4" /> Gyldig
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <XCircle className="mr-1 h-4 w-4" /> Ikke gyldig
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {bid.approved === undefined && (
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleApprove(bid.referenceCode, true)
                                }
                                disabled={!isBidValid(bid)}
                              >
                                Godkjenn
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleApprove(bid.referenceCode, false)
                                }
                              >
                                Avvis
                              </Button>
                            </div>
                          )}
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