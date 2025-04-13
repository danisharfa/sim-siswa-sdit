import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function middleware(req: NextRequest) {
  // console.log('🔍 Middleware running on:', req.nextUrl.pathname);

  const token = req.cookies.get('token')?.value;
  // console.log('🔑 Token:', token);

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userRole = payload.role as string;

    // Menentukan halaman dashboard yang sesuai berdasarkan role
    const rolePaths: Record<string, string> = {
      admin: '/dashboard/admin',
      teacher: '/dashboard/teacher',
      student: '/dashboard/student',
    };

    const expectedPath = rolePaths[userRole];

    // Jika role tidak valid, redirect ke login
    if (!expectedPath) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Jika sudah di halaman yang sesuai, lanjutkan request
    if (req.nextUrl.pathname.startsWith(expectedPath)) {
      return NextResponse.next();
    }

    // Redirect ke halaman yang sesuai dengan role
    return NextResponse.redirect(new URL(expectedPath, req.url));
  } catch (error) {
    console.error('Token invalid:', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
