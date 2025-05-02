import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Kalau belum login dan mau ke dashboard
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Kalau sudah login tapi mencoba akses halaman dashboard role yang salah
  if (token) {
    const userRole = token.role; // ambil role dari token jwt

    if (pathname === '/dashboard/account') {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}/account`, req.url));
    }

    const expectedRoleInPath = pathname.split('/')[2]; // 'admin', 'coordinator', 'teacher', 'student'

    // Cek apakah user mencoba akses role yang salah
    if (['admin', 'coordinator', 'teacher', 'student'].includes(expectedRoleInPath)) {
      if (userRole !== expectedRoleInPath) {
        // Kalau role user tidak sama dengan role di path, tetap di halaman itu atau redirect ke dashboard sesuai role
        const redirectUrl = new URL(`/dashboard/${userRole}`, req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
