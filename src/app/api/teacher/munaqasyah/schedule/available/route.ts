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

    const schedules = await prisma.munaqasyahSchedule.findMany({
      where: { examinerId: teacher.id },
      orderBy: { date: 'desc' },
      include: {
        scheduleRequests: {
          include: {
            request: {
              select: { id: true },
            },
          },
        },
        results: {
          select: { requestId: true }, // ✅ perbaikan
        },
      },
    });

    const filtered = schedules.filter((s) => {
      const resultRequestIds = new Set(s.results.map((r) => r.requestId));
      const unscoredExists = s.scheduleRequests.some(
        (sr) => !resultRequestIds.has(sr.request.id) // ✅ perbaikan
      );
      return unscoredExists;
    });

    const formatted = filtered.map((s) => ({
      id: s.id,
      date: s.date,
      sessionName: s.sessionName,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[TEACHER_GET_AVAILABLE_MUNAQASYAH_SCHEDULES]', error);
    return NextResponse.json({ success: false, message: 'Gagal memuat data' }, { status: 500 });
  }
}
