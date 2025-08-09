"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Trash2, RefreshCw, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { verifyReferenceCode, updateBidApproval } from "@/lib/mockBank";

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
  } | null; // Allow null to handle potential schema issues
  real_estate_id: string;
  bank_contact_name: string;
  bank_phone: string;
  bank_name: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    approved?: boolean;
    details?: Bid["bidder_info"];
  } | null>(null);
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

  const handleVerify = async () => {
    try {
      const result = await verifyReferenceCode(code);
      setVerificationResult(result);
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult({ valid: false });
    }
  };

  const handleApprove = async (referenceCode: string, approved: boolean) => {
    try {
      await updateBidApproval(referenceCode, approved);
      const res = await fetch(`/api/bids?realEstateId=${realEstateId}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`HTTP error! status: ${res.status}, response: ${text}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Approve refresh data:", data);
      if (data.error) throw new Error(data.error);
      setBids(data.bids || []);
    } catch (error) {
      console.error("Approval update failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bids/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`HTTP error! status: ${res.status}, response: ${text}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      setBids((prevBids) => prevBids.filter((bid) => bid.id !== id));
      console.log(`Deleted bid with id: ${id}`);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

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
    setVerificationResult(null);
    setCode("");
    console.log("Dashboard reset");
  };

  if (!session || session.role !== "broker") {
    return <div className="min-h-screen flex items-center justify-center">Loading or unauthorized...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Broker Dashboard - Verify and Manage Bidders for Real Estate: {realEstateId}</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex space-x-4">
            <Input
              placeholder="Skriv inn engangskode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleVerify} disabled={loading}>
              Verifiser
            </Button>
          </div>
          {verificationResult && (
            <div className={`p-4 rounded-lg flex items-center mt-4 ${verificationResult.valid ? "bg-green-50" : "bg-red-50"}`}>
              {verificationResult.valid ? <CheckCircle className="mr-2 text-green-600" /> : <XCircle className="mr-2 text-red-600" />}
              {verificationResult.valid ? "Gyldig bud" : "Ugyldig kode"}
              {verificationResult.valid && verificationResult.details && (
                <div className="ml-4 text-sm">
                  <p><strong>Navn:</strong> {verificationResult.details.name}</p>
                  <p><strong>E-post:</strong> {verificationResult.details.email}</p>
                  <p><strong>Telefon:</strong> {verificationResult.details.phone}</p>
                </div>
              )}
            </div>
          )}

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
                    <TableHead>Bank Contact Name</TableHead>
                    <TableHead>Bank Phone</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>{bid.bidder_info?.name || "Unknown"}</TableCell>
                      <TableCell>{bid.bidder_info?.email || "unknown@example.com"}</TableCell>
                      <TableCell>{bid.bidder_info?.phone || "N/A"}</TableCell>
                      <TableCell>{bid.reference_code}</TableCell>
                      <TableCell>{bid.status.toUpperCase()}</TableCell>
                      <TableCell>{bid.bank_contact_name}</TableCell>
                      <TableCell>{bid.bank_phone}</TableCell>
                      <TableCell>{bid.bank_name}</TableCell>
                      <TableCell>
                        {bid.approved === null && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(bid.reference_code, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApprove(bid.reference_code, false)}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(bid.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {bid.approved !== null && (
                          <span className="text-sm">
                            {bid.approved ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bids.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No active bidders yet.
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