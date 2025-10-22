import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        student: { select: { graduatedAt: true } },
      },
    });

    const data = users.map(({ student, ...rest }) => ({
      ...rest,
      graduatedAt: student?.graduatedAt ?? null,
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar pengguna',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar pengguna:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar pengguna' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { username, fullName, role } = body;

    if (!username || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi username, nama lengkap, dan role' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(username, 10);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username, fullName, password: passwordHash, role },
        select: { id: true, username: true, fullName: true, role: true, createdAt: true },
      });

      if (role === Role.coordinator) {
        await tx.coordinatorProfile.create({ data: { userId: user.id, nip: username } });
      } else if (role === Role.teacher) {
        await tx.teacherProfile.create({ data: { userId: user.id, nip: username } });
      } else if (role === Role.student) {
        await tx.studentProfile.create({ data: { userId: user.id, nis: username } });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil ditambahkan',
      data: createdUser,
    });
  } catch (error) {
    console.error('Gagal membuat pengguna:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat pengguna' },
      { status: 500 }
    );
  }
}
