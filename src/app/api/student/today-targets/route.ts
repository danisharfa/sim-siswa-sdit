import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get targets that are active today (start date <= today <= end date)
    const activeTargets = await prisma.weeklyTarget.findMany({
      where: {
        studentId: student.userId,
        startDate: { lte: tomorrow },
        endDate: { gte: today },
      },
      include: {
        surahStart: { select: { id: true, name: true } },
        surahEnd: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
        teacher: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        group: {
          include: {
            classroom: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    const targets = activeTargets.map((target) => {
      const endDate = new Date(target.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        id: target.id,
        type: target.type,
        startDate: target.startDate,
        endDate: target.endDate,
        description: target.description,
        status: target.status,
        progressPercent: target.progressPercent || 0,
        surahStart: target.surahStart,
        surahEnd: target.surahEnd,
        wafa: target.wafa,
        startAyat: target.startAyat,
        endAyat: target.endAyat,
        startPage: target.startPage,
        endPage: target.endPage,
        teacher: {
          name: target.teacher.user.fullName,
        },
        group: {
          name: target.group.name,
          className: target.group.classroom?.name || '-',
        },
        isExpired: daysRemaining < 0,
        daysRemaining: Math.max(0, daysRemaining),
      };
    });

    return NextResponse.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan',
      },
      { status: 500 }
    );
  }
}
