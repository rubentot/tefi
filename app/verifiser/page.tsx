"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/lib/supabase-client";
import { updateBidApproval } from "@/lib/bids";

export const dynamic = "force-dynamic";

interface UserSession {
  role: "broker" | "bidder";
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    socialNumber?: string;
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
  const { toast } = useToast();
  const [session, setSession] = useState<UserSession | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  // ✅ Session Check (only allow brokers)
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error || !data.session) {
        router.push("/");
        return;
      }

      const user = data.session.user;
      if (user.user_metadata.role !== "broker") {
        router.push("/");
        return;
      }

      setSession({
        role: "broker",
        user: {
          id: user.id,
          name: user.user_metadata.name || user.email?.split("@")[0],
          email: user.email,
          phone: user.user_metadata.phone,
          socialNumber: user.user_metadata.socialNumber,
        },
        accessToken: data.session.access_token,
        loginTime: Date.now(),
      });
    };

    checkSession();
  }, [router]);

  // ✅ Fetch All Bids
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
        toast({
          title: "Kunne ikke laste bud",
          description: "Prøv å laste siden på nytt.",
          variant: "destructive",
        });
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [toast]);

  // ✅ Approve or Reject Bid
  const handleApprove = async (referenceCode: string, approved: boolean) => {
    setUpdatingCode(referenceCode);

    try {
      await updateBidApproval(referenceCode, approved);
      setBids((prev) =>
        prev.map((bid) =>
          bid.referenceCode === referenceCode ? { ...bid, approved } : bid
        )
      );

      toast({
        title: approved ? "Bud godkjent" : "Bud avvist",
        description: `Referansekode: ${referenceCode}`,
      });
    } catch (err) {
      console.error("Approval update failed:", err);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere budstatus.",
        variant: "destructive",
      });
    } finally {
      setUpdatingCode(null);
    }
  };

  const isBidValid = (bid: Bid) => bid.bidAmount <= bid.maxFinancing;

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Laster inn bud...
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
                    <TableCell>{bid.bidAmount.toLocaleString("no-NO")}</TableCell>
                    <TableCell>{bid.maxFinancing.toLocaleString("no-NO")}</TableCell>
                    <TableCell>{bid.referenceCode}</TableCell>
                    <TableCell>
                      {bid.approved === true ? (
                        <span className="text-green-600 font-semibold">Godkjent</span>
                      ) : bid.approved === false ? (
                        <span className="text-red-600 font-semibold">Avvist</span>
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
                            onClick={() => handleApprove(bid.referenceCode, true)}
                            disabled={!isBidValid(bid) || updatingCode === bid.referenceCode}
                          >
                            {updatingCode === bid.referenceCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Godkjenn"
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleApprove(bid.referenceCode, false)}
                            disabled={updatingCode === bid.referenceCode}
                          >
                            {updatingCode === bid.referenceCode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Avvis"
                            )}
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
