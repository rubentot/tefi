"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";

interface Bid {
  id: string;
  bidAmount: number;
  maxFinancing: number;
  referenceCode: string;
  approved?: boolean;
}

export default function MyBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyBids = async () => {
      setLoading(true);
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session) return;

        const userId = sessionData.session.user.id;
        const { data, error } = await supabaseClient
          .from("bids")
          .select("id, bid_amount, max_financing_amount, reference_code, approved")
          .eq("user_id", userId)
          .order("inserted_at", { ascending: false });

        if (error) throw error;

        setBids(
          data.map((b: any) => ({
            id: b.id,
            bidAmount: b.bid_amount,
            maxFinancing: b.max_financing_amount,
            referenceCode: b.reference_code,
            approved: b.approved,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch bids:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBids();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Laster inn dine bud...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Mine Bud</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <p className="text-center">Du har ikke lagt inn noen bud ennå.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bud (kr)</TableHead>
                  <TableHead>Finansiering (kr)</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>{bid.bidAmount.toLocaleString("no-NO")}</TableCell>
                    <TableCell>{bid.maxFinancing.toLocaleString("no-NO")}</TableCell>
                    <TableCell>{bid.referenceCode}</TableCell>
                    <TableCell>
                      {bid.approved === true ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" /> Godkjent
                        </div>
                      ) : bid.approved === false ? (
                        <div className="flex items-center text-red-600">
                          <XCircle className="mr-1 h-4 w-4" /> Avvist
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <Clock className="mr-1 h-4 w-4" /> Venter på bekreftelse
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
