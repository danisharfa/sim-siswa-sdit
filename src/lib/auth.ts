import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('Missing JWT_SECRET');

const secretKey = new TextEncoder().encode(secret);

export async function getUser() {
  const token = (await cookies()).get('token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      username: payload.username as string,
      namaLengkap: payload.namaLengkap as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error('[AUTH_ERROR]: Invalid token', error);
    return null;
  }
}
