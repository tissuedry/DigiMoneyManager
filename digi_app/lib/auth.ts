import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-digi-money-manager-12345';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JWTPayload {
  id: number;
  nama: string;
  email: string;
  role: string;
  roles?: string[];
  proyekId?: number | null;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
