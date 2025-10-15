import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teachers = await prisma.teacherProfile.findMany({
      select: {
        nip: true,
        userId: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: teachers.map((t) => ({
        id: t.userId,
        nip: t.nip,
        fullName: t.user.fullName,
      })),
    });
  } catch (error) {
    console.error('[API_TEACHER_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data guru' },
      { status: 500 }
    );
  }
}
