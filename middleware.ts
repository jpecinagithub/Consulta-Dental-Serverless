/**
 * Middleware de autenticación para /admin.
 * Corre en Edge Runtime — usa Web Crypto API (no Node.js crypto).
 * La lógica de firma en lib/auth.ts (Node.js) debe mantenerse sincronizada.
 */
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'dental_admin';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 horas

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET ?? 'dev-secret';
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;

    const payload = token.slice(0, lastDot);
    const hexSig  = token.slice(lastDot + 1);

    // Comprobar expiración
    const ts = Number(payload.split(':')[1]);
    if (isNaN(ts) || Date.now() - ts > SESSION_MAX_AGE_MS) return false;

    // Verificar HMAC-SHA256 con Web Crypto API (compatible con Edge Runtime)
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const sigBytes = new Uint8Array(
      (hexSig.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
    );

    return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
