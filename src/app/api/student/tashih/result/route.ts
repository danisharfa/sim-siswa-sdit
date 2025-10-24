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

    const data = await prisma.tashihResult.findMany({
      where: {
        tashihRequest: {
          studentId: student.userId,
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
            juz: { select: { id: true, name: true } },
            surah: { select: { id: true, name: true } },
            wafa: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hasil Tashih berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil Hasil Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Hasil Tashih' },
      { status: 500 }
    );
  }
}
