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

    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal menambah pengguna' },
      { status: 500 }
    );
  }
}
