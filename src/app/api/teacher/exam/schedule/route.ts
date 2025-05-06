import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    const schedules = await prisma.examSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        schedules: {
          some: {
            examRequest: {
              teacherId: teacher.id,
            },
          },
        },
      },
      include: {
        schedules: {
          where: {
            examRequest: {
              teacherId: teacher.id,
            },
          },
          include: {
            examRequest: {
              select: {
                id: true,
                examType: true,
                status: true,
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                    group: {
                      select: {
                        name: true,
                        classroom: {
                          select: {
                            name: true,
                            academicYear: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil jadwal ujian bimbingan',
      data: schedules,
    });
  } catch (error) {
    console.error('[TEACHER_EXAM_RESULT_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data hasil ujian' },
      { status: 500 }
    );
  }
}
