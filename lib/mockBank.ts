// lib/mockBank.ts
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

interface FinancingProof {
  userId: string; // From BankID sub
  limit: number;
  expiration: Date;
  token: string;
}

const DB_PATH = path.join(process.cwd(), 'tmp/mock_bank.json');

async function getDb(): Promise<FinancingProof[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveDb(data: FinancingProof[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function addProof(userId: string, limit: number): Promise<string> {
  const db = await getDb();
  const token = uuidv4(); // Unique token (Claim 1)
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  db.push({ userId, limit, expiration, token });
  await saveDb(db);
  return token;
}

export async function verifyBid(userId: string, bidAmount: number): Promise<boolean> {
  const db = await getDb();
  const proof = db.find(p => p.userId === userId && new Date(p.expiration) > new Date());
  if (!proof || bidAmount > proof.limit) return false;
  return true; // Within limit (Claim 1)
}

export async function getToken(userId: string): Promise<string | null> {
  const db = await getDb();
  const proof = db.find(p => p.userId === userId);
  return proof?.token || null;
}