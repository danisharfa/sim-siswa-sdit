import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.munaqasyahSchedule.findMany({
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
          select: { requestId: true },
        },
      },
    });

    const filtered = schedules.filter((s) => {
      const requestIdsWithResult = new Set(s.results.map((r) => r.requestId));
      const unscoredExists = s.scheduleRequests.some(
        (sr) => !requestIdsWithResult.has(sr.request.id)
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

    return NextResponse.json({
      success: true,
      message: 'Munaqasyah yang belum dinilai berhasil diambil',
      data: formatted,
    });
  } catch (error) {
    console.error('Gagal mengambil Munaqasyah yang belum dinilai:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Munaqasyah yang belum dinilai' },
      { status: 500 }
    );
  }
}
