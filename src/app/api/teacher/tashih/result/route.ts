import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const results = await prisma.tashihResult.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tashihSchedule: {
          select: {
            id: true,
            date: true,
            sessionName: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
        tashihRequest: {
          select: {
            id: true,
            teacherId: true,
            tashihType: true,
            surah: { select: { id: true, name: true } },
            juz: { select: { id: true, name: true } },
            wafa: { select: { id: true, name: true } },
            startPage: true,
            endPage: true,
            student: {
              select: {
                nis: true,
                user: { select: { fullName: true } },
                group: {
                  select: {
                    id: true,
                    name: true,
                    classroom: {
                      select: { name: true, academicYear: true, semester: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const filtered = results.filter(
      (r) => r.tashihRequest !== null && r.tashihRequest.teacherId === teacher.id
    );

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error('[TEACHER_TASHIH_RESULT_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data hasil tashih' },
      { status: 500 }
    );
  }
}
