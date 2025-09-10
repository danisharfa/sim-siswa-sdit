import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const schedules = await prisma.munaqasyahSchedule.findMany({
      where: { examinerId: teacher.userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        sessionName: true,
        startTime: true,
        endTime: true,
        location: true,
      },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('[TEACHER_MUNAQASYAH_SCHEDULE]', error);
    return NextResponse.json({ success: false, message: 'Gagal memuat data' }, { status: 500 });
  }
}
