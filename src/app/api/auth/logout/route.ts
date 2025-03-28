import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out' },
    { status: 200 }
  );

  response.headers.set(
    'Set-Cookie',
    'token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'
  );

  return response;
}
