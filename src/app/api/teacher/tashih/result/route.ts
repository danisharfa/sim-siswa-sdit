import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    const data = await prisma.tashihResult.findMany({
      where: {
        tashihRequest: {
          teacherId: teacher.userId,
        },
      },
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
            tashihType: true,
            startPage: true,
            endPage: true,
            surah: { select: { id: true, name: true } },
            juz: { select: { id: true, name: true } },
            wafa: { select: { id: true, name: true } },
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
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil hasil Tashih Siswa Bimbingan',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil hasil Tashih Siswa Bimbingan:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil hasil Tashih Siswa Bimbingan' },
      { status: 500 }
    );
  }
}
