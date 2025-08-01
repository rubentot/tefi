"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import { updateBidApproval } from "@/lib/bids"; // Make sure this function updates Supabase

export const dynamic = "force-dynamic";

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
  maxFinancing: number;
  referenceCode: string;
  approved?: boolean;
}

export default function VerifyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Check Broker Session
  useEffect(() => {
    const checkSession = async () => {
      // LocalStorage first (instant)
      const stored = localStorage.getItem("bankid_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === "broker") {
          setSession(parsed);
          return;
        }
      }

      // Fallback: Supabase session restore
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

  // ✅ Fetch All Bids with Bidder Info
  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
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
          maxFinancing: b.max_financing_amount,
          referenceCode: b.reference_code,
          approved: b.approved,
        }));

        setBids(mapped);
      } catch (err) {
        console.error("Failed to fetch bids:", err);
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.role === "broker") {
      fetchBids();
    }
  }, [session]);

  // ✅ Approve or Reject Bid
  const handleApprove = async (referenceCode: string, approved: boolean) => {
    try {
      await updateBidApproval(referenceCode, approved);
      setBids((prev) =>
        prev.map((bid) =>
          bid.referenceCode === referenceCode ? { ...bid, approved } : bid
        )
      );
    } catch (err) {
      console.error("Approval update failed:", err);
    }
  };

  // ✅ Check if Bid is Gyldig
  const isBidValid = (bid: Bid) => bid.bidAmount <= bid.maxFinancing;

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
          {bids.length === 0 ? (
            <p className="text-center">Ingen aktive bud enda.</p>
          ) : (
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
                {bids.map((bid) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
