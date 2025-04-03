import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, namaLengkap, role } = await req.json();

    if (!username || !namaLengkap || !role) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const hashedPassword = await argon2.hash(username);

    const newUser = await prisma.user.create({
      data: { username, namaLengkap, role, password: hashedPassword },
    });

    const generateCustomId = (prefix: string) =>
      `${prefix}-${crypto.randomUUID()}`;

    console.log('Membuat user:', newUser);

    if (role === 'student') {
      const siswaId = generateCustomId('SISWA');
      console.log('ID Siswa:', siswaId, 'User ID:', newUser.id);

      try {
        await prisma.siswaProfile.create({
          data: {
            id: siswaId,
            userId: newUser.id,
          },
        });
        console.log('Siswa Profile berhasil dibuat!');
      } catch (error) {
        console.error('Gagal membuat Siswa Profile:', error);
      }
    }

    if (role === 'teacher') {
      const guruId = generateCustomId('GURU');
      console.log('ID Guru:', guruId, 'User ID:', newUser.id);

      try {
        await prisma.guruProfile.create({
          data: {
            id: guruId,
            userId: newUser.id,
          },
        });
        console.log('Guru Profile berhasil dibuat!');
      } catch (error) {
        console.error('Gagal membuat Guru Profile:', error);
      }
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error saat membuat user:', error);
    return NextResponse.json(
      { error: 'Gagal menambah pengguna' },
      { status: 500 }
    );
  }
}
