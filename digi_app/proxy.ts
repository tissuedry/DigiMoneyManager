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

    // Ganti 'sigBuf as any' menjadi 'sigBuf.buffer' agar aman di Edge Runtime
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuf.buffer as ArrayBuffer,
      data
    );

    if (!isValid) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 0. Validasi Content-Type Global untuk POST, PUT, PATCH pada API
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isMultipart = contentType.includes('multipart/form-data');
    const isLogout = pathname === '/api/auth/logout';

    if (!isJson && !isMultipart && !isLogout) {
      return new NextResponse(
        JSON.stringify({ message: 'Unsupported Content-Type. Only application/json and multipart/form-data are allowed.' }),
        { status: 415, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
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
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // 2. Get auth token
  let token = req.cookies.get('auth_token')?.value;

  if (!token) {
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
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('auth_token');
    return res;
  }

  // 5. Enforce RBAC (Amankan ekstraksi roles dari payload)
  const role = payload.role || '';
  const roles: string[] = Array.isArray(payload.roles)
    ? payload.roles
    : typeof payload.roles === 'string'
    ? [payload.roles]
    : [role].filter(Boolean);

  // Jika mengunjungi root page, arahkan ke dashboard masing-masing
  if (pathname === '/') {
    if (roles.includes('Direktur / Manajemen')) {
      return NextResponse.redirect(new URL('/manager', req.url));
    }
    if (roles.includes('Tim Keuangan')) {
      return NextResponse.redirect(new URL('/keuangan', req.url));
    }
    if (payload.proyekId === undefined || payload.proyekId === null) {
      return NextResponse.redirect(new URL('/select-project', req.url));
    }
    if (role === 'Project Manager' || roles.includes('Project Manager')) {
      return NextResponse.redirect(new URL('/pm', req.url));
    }
    return NextResponse.redirect(new URL('/karyawan', req.url));
  }

  if (pathname.startsWith('/select-project')) {
    if (roles.includes('Direktur / Manajemen')) {
      return NextResponse.redirect(new URL('/manager', req.url));
    }
    if (roles.includes('Tim Keuangan')) {
      return NextResponse.redirect(new URL('/keuangan', req.url));
    }
  }

  const isRegularMember = roles.includes('Karyawan') || roles.includes('Project Manager');
  if (isRegularMember && (payload.proyekId === undefined || payload.proyekId === null)) {
    if (pathname.startsWith('/karyawan') || pathname.startsWith('/pm')) {
      return NextResponse.redirect(new URL('/select-project', req.url));
    }
  }

  if (pathname.startsWith('/karyawan') && role !== 'Karyawan') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/pm') && role !== 'Project Manager') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/keuangan') && !roles.includes('Tim Keuangan')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/manager') && !roles.includes('Direktur / Manajemen')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/api/manager') && !roles.includes('Direktur / Manajemen')) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: Only Direktur / Manajemen can access manager APIs' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (pathname.startsWith('/api/coa') && !roles.includes('Tim Keuangan')) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: Only Tim Keuangan can manage CoA' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (
    pathname.startsWith('/api/proyek/') && 
    (pathname.endsWith('/budget') || pathname.endsWith('/pos')) && 
    !roles.includes('Project Manager') && 
    !roles.includes('Tim Keuangan') && 
    !roles.includes('Direktur / Manajemen')
  ) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden: Only Project Manager, Tim Keuangan, or Direktur / Manajemen can modify budget' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Amankan pengiriman ke headers (pastikan nilai dikonversi ke string dengan aman)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.id ? String(payload.id) : '');
  requestHeaders.set('x-user-email', payload.email ? String(payload.email) : '');
  requestHeaders.set('x-user-role', String(role));
  requestHeaders.set('x-user-roles', roles.join(',')); // Sekarang dijamin aman karena 'roles' pasti Array
  
  if (payload.proyekId !== undefined && payload.proyekId !== null) {
    requestHeaders.set('x-user-proyek-id', String(payload.proyekId));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/', '/select-project/:path*', '/karyawan/:path*', '/pm/:path*', '/keuangan/:path*', '/manager/:path*', '/api/:path*'],
};
