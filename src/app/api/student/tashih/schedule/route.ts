import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Profil siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    const data = await prisma.tashihSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        schedules: {
          some: {
            tashihRequest: {
              studentId: student.userId,
            },
          },
        },
      },
      include: {
        schedules: {
          where: {
            tashihRequest: {
              studentId: student.userId,
            },
          },
          include: {
            tashihRequest: {
              select: {
                id: true,
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
                  },
                },
                teacher: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
                group: {
                  select: {
                    name: true,
                    classroom: {
                      select: {
                        name: true,
                        academicYear: true,
                        semester: true,
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
      message: 'Jadwal Tashih berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil Jadwal Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Jadwal Tashih' },
      { status: 500 }
    );
  }
}
