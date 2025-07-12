// lib/mockBank.ts (Updated to store bids with codes and bidder info)
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

interface FinancingProof {
  userId: string;
  limit: number;
  expiration: Date;
  token: string;
}

interface Bid {
  id: string; // Unique bid ID
  userId: string;
  bidAmount: number;
  referenceCode: string; // The one-time/reference code
  expiration: Date; // Code expiration
  bidderInfo: {
    name: string;
    email: string;
    phone: string;
    bankContact: string; // Mock or from session/bank API
  };
}

const DB_PATH = path.join(process.cwd(), 'tmp/mock_bank.json');

async function getDb(): Promise<{ proofs: FinancingProof[]; bids: Bid[] }> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return { proofs: [], bids: [] };
  }
}

async function saveDb(data: { proofs: FinancingProof[]; bids: Bid[] }) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function addProof(userId: string, limit: number): Promise<string> {
  const db = await getDb();
  const token = uuidv4();
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  db.proofs.push({ userId, limit, expiration, token });
  await saveDb(db);
  return token;
}

export async function verifyBid(userId: string, bidAmount: number): Promise<boolean> {
  const db = await getDb();
  const proof = db.proofs.find(p => p.userId === userId && new Date(p.expiration) > new Date());
  return !!(proof && bidAmount <= proof.limit);
}

export async function addBid(session: UserSession, bidAmount: number): Promise<string> {
  const db = await getDb();
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
      bankContact: 'mock-bank-contact@example.com', // In real, from bank API
    },
  };
  db.bids.push(bid);
  await saveDb(db);
  return referenceCode;
}

export async function verifyReferenceCode(code: string): Promise<{ valid: boolean; details?: Bid['bidderInfo'] }> {
  const db = await getDb();
  const bid = db.bids.find(b => b.referenceCode === code && new Date(b.expiration) > new Date());
  if (!bid) return { valid: false };
  const isValid = await verifyBid(bid.userId, bid.bidAmount);
  return { valid: isValid, details: isValid ? bid.bidderInfo : undefined };
}