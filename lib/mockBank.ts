// lib/mockBank.ts (Updated to use in-memory storage instead of fs)
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
  bidderInfo: {
    name: string;
    email: string;
    phone: string;
    bankContact: string;
  };
}

// In-memory DB (resets on server restart, fine for mock/dev)
let db: { proofs: FinancingProof[]; bids: Bid[] } = { proofs: [], bids: [] };

export async function addProof(userId: string, limit: number): Promise<string> {
  const token = uuidv4();
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  db.proofs.push({ userId, limit, expiration, token });
  return token;
}

export async function verifyBid(userId: string, bidAmount: number): Promise<boolean> {
  const proof = db.proofs.find(p => p.userId === userId && new Date(p.expiration) > new Date());
  return !!(proof && bidAmount <= proof.limit);
}

export async function addBid(session: any, bidAmount: number): Promise<string> {
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
  };
  db.bids.push(bid);
  return referenceCode;
}

export async function verifyReferenceCode(code: string): Promise<{ valid: boolean; details?: Bid['bidderInfo'] }> {
  const bid = db.bids.find(b => b.referenceCode === code && new Date(b.expiration) > new Date());
  if (!bid) return { valid: false };
  const isValid = await verifyBid(bid.userId, bid.bidAmount);
  return { valid: isValid, details: isValid ? bid.bidderInfo : undefined };
}