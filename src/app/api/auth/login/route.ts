import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth-service';
import { getErrorMessage } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  try {
    const { token, role } = await authenticateUser(username, password);
    (await cookies()).set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    (await cookies()).set('role', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    console.log('Token set in cookies:', token);
    console.log('Role set in cookies:', role);

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 401 });
  }
}
