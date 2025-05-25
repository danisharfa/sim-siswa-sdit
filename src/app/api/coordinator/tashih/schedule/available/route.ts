import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const schedules = await prisma.tashihSchedule.findMany({
      orderBy: { date: 'desc' },
      include: {
        schedules: {
          include: {
            tashihRequest: {
              include: {
                results: true,
              },
            },
          },
        },
      },
    });

    const formatted = schedules.map((s) => ({
      id: s.id,
      date: s.date,
      sessionName: s.sessionName,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET_AVAILABLE_SCHEDULES]', error);
    return NextResponse.json({ success: false, message: 'Gagal memuat data' }, { status: 500 });
  }
}
