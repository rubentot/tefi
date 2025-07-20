"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllBids, verifyReferenceCode, updateBidApproval } from "@/lib/mockBank";
export const dynamic = 'force-dynamic';

// Define types based on your session and Bid structure
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
  userId: string;
  bidAmount: number;
  referenceCode: string;
  expiration: Date;
  approved?: boolean;
  bidderInfo: {
    name: string;
    email: string;
    phone: string;
    bankContact: string;
  };
  realEstateId: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; approved?: boolean; details?: any } | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [realEstateId, setRealEstateId] = useState("property1"); // Mock; make dynamic later
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
      if (session?.role === "broker") {
        setLoading(true);
        try {
          const activeBids = await getAllBids(realEstateId); // Await the async call
          setBids(activeBids);
        } catch (error) {
          console.error("Failed to fetch bids:", error);
          setBids([]); // Set to empty on error
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBids();
  }, [session, realEstateId]);

  const handleVerify = async () => {
    try {
      const result = await verifyReferenceCode(code);
      setVerificationResult(result);
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult({ valid: false });
    }
  };

  const handleApprove = async (code: string, approved: boolean) => {
    try {
      await updateBidApproval(code, approved);
      setBids(await getAllBids(realEstateId)); // Refresh with await
    } catch (error) {
      console.error("Approval update failed:", error);
    }
  };

  if (!session || session.role !== "broker") {
    return <div className="min-h-screen flex items-center justify-center">Loading or unauthorized...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Broker Dashboard - Verify and Manage Bidders for Real Estate: {realEstateId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Code Verify Section */}
          <div>
            <Input placeholder="Skriv inn engangskode" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button onClick={handleVerify} className="mt-2" disabled={loading}>
              Verifiser
            </Button>
            {verificationResult && (
              <div className={`p-4 rounded-lg flex items-center mt-4 ${verificationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                {verificationResult.valid ? <CheckCircle className="mr-2 text-green-600" /> : <XCircle className="mr-2 text-red-600" />}
                {verificationResult.valid ? 'Gyldig bud' : 'Ugyldig kode'}
                {verificationResult.valid && verificationResult.details && (
                  <div className="ml-4 text-sm">
                    <p><strong>Navn:</strong> {verificationResult.details.name}</p>
                    <p><strong>E-post:</strong> {verificationResult.details.email}</p>
                    <p><strong>Telefon:</strong> {verificationResult.details.phone}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Bidders Table */}
          <div>
            <h3 className="text-lg font-semibold mb-2">All Bidders</h3>
            {loading ? (
              <div className="text-center">Loading bids...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>{bid.bidderInfo.name}</TableCell>
                      <TableCell>{bid.bidderInfo.email}</TableCell>
                      <TableCell>{bid.bidderInfo.phone}</TableCell>
                      <TableCell>{bid.referenceCode}</TableCell>
                      <TableCell>{bid.approved === true ? 'Approved' : bid.approved === false ? 'Rejected' : 'Pending'}</TableCell>
                      <TableCell>
                        {bid.approved === undefined && (
                          <div className="flex gap-2">
                            <Button variant="default" size="sm" onClick={() => handleApprove(bid.referenceCode, true)}>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleApprove(bid.referenceCode, false)}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bids.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No active bidders yet.</TableCell>
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