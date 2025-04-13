import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secretKey);

    return NextResponse.json({ role: payload.role }, { status: 200 });
  } catch (error) {
    console.error('[TOKEN_VERIFY_ERROR]', error);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}
