import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== Role.teacher) {
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

    const schedules = await prisma.tashihSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        schedules: {
          some: {
            tashihRequest: {
              teacherId: teacher.id,
            },
          },
        },
      },
      include: {
        schedules: {
          where: {
            tashihRequest: {
              teacherId: teacher.id,
            },
          },
          include: {
            tashihRequest: {
              select: {
                id: true,
                status: true,
                tashihType: true,
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                wafa: { select: { name: true } },
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
