import { createHash, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'bank-indonesia-driver-booking-secret-key';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

// Simple token generation using crypto
export function signToken(payload: { userId: string; email: string; role: string }): string {
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const data = { ...payload, exp };
  const dataStr = JSON.stringify(data);
  const signature = createHash('sha256')
    .update(dataStr + JWT_SECRET)
    .digest('hex');
  
  const token = Buffer.from(dataStr).toString('base64url');
  return `${token}.${signature}`;
}

// Simple token verification
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [dataB64, signature] = token.split('.');
    if (!dataB64 || !signature) return null;

    const dataStr = Buffer.from(dataB64, 'base64url').toString('utf-8');
    const expectedSignature = createHash('sha256')
      .update(dataStr + JWT_SECRET)
      .digest('hex');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(dataStr) as TokenPayload;
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Generate random token for session
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
