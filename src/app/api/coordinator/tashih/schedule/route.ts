import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
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
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                    group: {
                      select: {
                        name: true,
                        classroom: {
                          select: { name: true, academicYear: true, semester: true },
                        },
                      },
                    },
                  },
                },
                teacher: {
                  select: {
                    user: { select: { fullName: true } },
                  },
                },
                surah: { select: { name: true } },
                juz: { select: { name: true } },
                wafa: { select: { name: true } },
              },
            },
          },
        },
        scheduledByCoordinator: {
          select: { user: { select: { fullName: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil jadwal tashih',
      data: schedules,
    });
  } catch (error) {
    console.error('[GET_TASHIH_SCHEDULES]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data jadwal tashih' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coordinator) {
      return NextResponse.json(
        { success: false, message: 'Koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { date, sessionName, startTime, endTime, location, requestIds } = body;

    if (!date || !sessionName || !startTime || !endTime || !location || !requestIds?.length) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi semua data' },
        { status: 400 }
      );
    }

    const inputDate = new Date(date);
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    let schedule = await prisma.tashihSchedule.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        sessionName,
        startTime,
        endTime,
        location,
      },
    });

    const isNewSchedule = !schedule;

    if (isNewSchedule) {
      schedule = await prisma.tashihSchedule.create({
        data: {
          scheduledByCoordinatorId: coordinator.id,
          date: inputDate,
          sessionName,
          startTime,
          endTime,
          location,
        },
      });
    }

    await prisma.tashihScheduleRequest.createMany({
      data: requestIds.map((requestId: string) => ({
        scheduleId: schedule!.id,
        requestId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: isNewSchedule
        ? 'Jadwal tashih baru berhasil dibuat'
        : 'Jadwal ditemukan, siswa berhasil ditambahkan',
      data: schedule,
    });
  } catch (error) {
    console.error('[POST_TASHIH_SCHEDULE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan jadwal' },
      { status: 500 }
    );
  }
}
