import { v4 as uuidv4 } from 'uuid';

interface FinancingProof {
  userId: string;
  limit: number;
  expiration: Date;
  token: string;
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
  realEstateId: string; // Single definition with realEstateId
}

let db: { proofs: FinancingProof[]; bids: Bid[] } = { proofs: [], bids: [] };

// Add proof function
export async function addProof(userId: string, limit: number): Promise<string> {
  const token = uuidv4();
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  db.proofs.push({ userId, limit, expiration, token });
  return token;
}

// Update bid approval function
export async function updateBidApproval(code: string, approved: boolean) {
  const bidIndex = db.bids.findIndex(b => b.referenceCode === code);
  if (bidIndex !== -1) {
    db.bids[bidIndex].approved = approved;
  }
}

// Add bid function with realEstateId
export async function addBid(session: any, bidAmount: number, realEstateId: string = "property1"): Promise<string> {
  const referenceCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiration = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  const bid: Bid = {
    id: uuidv4(),
    userId: session.user.id,
    bidAmount,
    referenceCode,
    expiration,
    bidderInfo: {
      name: session.user.name,
      email: session.user.email,
      phone: session.user.phone,
      bankContact: 'mock-bank-contact@example.com',
    },
    realEstateId,
  };
  db.bids.push(bid);
  return referenceCode;
}

// Get all bids function
export async function getAllBids(realEstateId?: string): Promise<Bid[]> {
  const activeBids = db.bids.filter(b => new Date(b.expiration) > new Date());
  if (realEstateId) {
    return activeBids.filter(b => b.realEstateId === realEstateId);
  }
  return activeBids;
}

// Verify bid function (implementing the missing dependency)
async function verifyBid(userId: string, bidAmount: number): Promise<boolean> {
  const proof = db.proofs.find(p => p.userId === userId && new Date(p.expiration) > new Date());
  return !!(proof && bidAmount <= proof.limit);
}

// Verify reference code function
export async function verifyReferenceCode(code: string): Promise<{ valid: boolean; approved?: boolean; details?: Bid['bidderInfo'] }> {
  const bid = db.bids.find(b => b.referenceCode === code && new Date(b.expiration) > new Date());
  if (!bid) return { valid: false };
  const isValid = await verifyBid(bid.userId, bid.bidAmount);
  return { valid: isValid, approved: bid.approved, details: isValid ? bid.bidderInfo : undefined };
}