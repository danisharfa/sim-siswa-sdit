// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTVerifyResult } from 'jose';

// --- Validate Env Variable Early ---
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// --- Helper to verify token ---
async function verifyToken(token: string): Promise<JWTVerifyResult> {
  return jwtVerify(token, secretKey);
}

// --- Define Role Based Paths ---
const rolePaths: Record<string, string> = {
  admin: '/dashboard/admin',
  teacher: '/dashboard/teacher',
  student: '/dashboard/student',
};

// --- Main Middleware ---
export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware running on:', req.nextUrl.pathname);
  }

  const token = req.cookies.get('token')?.value;

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔑 No token found.');
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await verifyToken(token);

    const userRole = payload.role as string | undefined;
    const expectedPath = rolePaths[userRole ?? ''];

    if (!expectedPath) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 Unauthorized role detected:', userRole);
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (req.nextUrl.pathname.startsWith(expectedPath)) {
      return NextResponse.next();
    }

    // Redirect if user tries to access wrong dashboard
    return NextResponse.redirect(new URL(expectedPath, req.url));
  } catch (error) {
    console.error('🚫 Token verification failed:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

// --- Config which routes use this middleware ---
export const config = {
  matcher: ['/dashboard/:path*'],
};
