import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-digi-money-manager-12345';

// Decode base64url string (compatible with Edge runtime)
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

// Convert base64url to Uint8Array for verification
function base64UrlToUint8Array(str: string): Uint8Array {
  const binaryString = base64UrlDecode(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Verify JWT using Web Crypto API (supported in Edge Runtime)
async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payloadStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuf = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf as any,
      data
    );

    if (!isValid) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Exclude public static files, images, login pages, and register page
  if (
    pathname.startsWith('/_next') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/logout' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/api-docs' ||
    pathname === '/api/openapi.json' ||
    pathname.includes('.') // static assets e.g. /favicon.ico, /bukti_struk.png
  ) {
    return NextResponse.next();
  }

  // 2. Get auth token
  let token = req.cookies.get('auth_token')?.value;

  if (!token) {
    // Check Authorization header for API calls
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 3. Reject if no token
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: No token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4. Verify token
  const payload = await verifyJWT(token, JWT_SECRET);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Delete invalid cookie and redirect to login
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('auth_token');
    return res;
  }

  // 5. Enforce RBAC
  const role = payload.role; // e.g. "Karyawan", "Project Manager", "Tim Keuangan", "Direktur / Manajemen"

  // If visiting the root page with a valid session, redirect to the corresponding dashboard
  if (pathname === '/') {
    if (role === 'Karyawan') {
      return NextResponse.redirect(new URL('/karyawan', req.url));
    }
    if (role === 'Project Manager') {
      return NextResponse.redirect(new URL('/pm/budget', req.url));
    }
    if (role === 'Tim Keuangan') {
      return NextResponse.redirect(new URL('/keuangan/chart-of-account', req.url));
    }
  }

  // Route protections
  if (pathname.startsWith('/karyawan') && role !== 'Karyawan') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/pm') && role !== 'Project Manager') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/keuangan') && role !== 'Tim Keuangan') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // API protections based on roles
  if (pathname.startsWith('/api/coa') && role !== 'Tim Keuangan') {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: Only Tim Keuangan can manage CoA' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (pathname.startsWith('/api/proyek/') && pathname.endsWith('/budget') && role !== 'Project Manager' && role !== 'Tim Keuangan') {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: Only Project Manager or Tim Keuangan can modify budget' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Valid session, store parsed payload headers for upstream API handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  if (payload.proyekId) requestHeaders.set('x-user-proyek-id', payload.proyekId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/', '/karyawan/:path*', '/pm/:path*', '/keuangan/:path*', '/api/:path*'],
};
