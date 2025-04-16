import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function getUser() {
  if (!secretKey) throw new Error('JWT_SECRET is missing');

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
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}
