import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error('User tidak ditemukan');

  const match = await argon2.verify(user.password, password);
  if (!match) throw new Error('Password salah');

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );

  return { token, role: user.role };
}
