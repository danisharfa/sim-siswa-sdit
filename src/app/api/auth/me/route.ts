// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred';

    console.error('Error in /api/auth/me:', errorMessage);

    return NextResponse.json(
      { message: 'Server error', error: errorMessage },
      { status: 500 }
    );
  }
}
