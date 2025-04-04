import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
