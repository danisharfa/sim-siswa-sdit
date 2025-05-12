import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // console.log('🔍 Request cookies:', req.cookies.getAll());

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || '',
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName:
      process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
  });

  // console.log('🔍 Token in middleware:', token);

  // Jika belum login dan mengakses halaman dashboard, arahkan ke login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    const userRole = token.role as string;
    const expectedRoleInPath = pathname.split('/')[2]; // misal: admin, coordinator, teacher, student

    // Kalau user akses /dashboard/account → redirect ke /dashboard/{role}/account
    if (pathname === '/dashboard/account') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}/account`, req.url));
    }

    const isValidRole = ['admin', 'coordinator', 'teacher', 'student'].includes(expectedRoleInPath);

    if (isValidRole) {
      if (userRole !== expectedRoleInPath) {
        // Salah role → redirect ke /dashboard/{role}
        const redirectUrl = new URL(`/dashboard/${userRole}`, req.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Benar role → biarkan lewat
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
