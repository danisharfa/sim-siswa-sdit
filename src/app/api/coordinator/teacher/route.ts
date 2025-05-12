import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: teachers.map((t) => ({
        id: t.id,
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
