import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'coordinator') {
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

    const schedules = await prisma.examSchedule.findMany({
      orderBy: { date: 'desc' },
      include: {
        schedules: {
          include: {
            examRequest: {
              select: {
                id: true,
                examType: true,
                status: true,
                surah: {
                  select: { id: true, name: true },
                },
                juz: {
                  select: { id: true, name: true },
                },
                student: {
                  select: {
                    nis: true,
                    user: {
                      select: { fullName: true },
                    },
                    group: {
                      select: {
                        name: true,
                        classroom: {
                          select: {
                            name: true,
                            academicYear: true,
                          },
                        },
                      },
                    },
                  },
                },
                teacher: {
                  select: {
                    user: {
                      select: { fullName: true },
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
      message: 'Berhasil mengambil jadwal ujian',
      data: schedules,
    });
  } catch (error) {
    console.error('[COORDINATOR_EXAM_SCHEDULE_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data jadwal ujian' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'coordinator') {
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
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const inputDate = new Date(date);
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    let schedule = await prisma.examSchedule.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        sessionName,
        startTime,
        endTime,
        location,
      },
    });

    const isNewSchedule = !schedule;

    if (isNewSchedule) {
      schedule = await prisma.examSchedule.create({
        data: {
          coordinatorId: coordinator.id,
          date: inputDate,
          sessionName,
          startTime,
          endTime,
          location,
        },
      });
    }

    await prisma.scheduleRequest.createMany({
      data: requestIds.map((requestId: string) => ({
        scheduleId: schedule!.id,
        requestId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: isNewSchedule
        ? 'Jadwal baru berhasil dibuat'
        : 'Jadwal ditemukan, siswa berhasil ditambahkan',
      data: schedule,
    });
  } catch (error) {
    console.error('[EXAM_SCHEDULE_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan jadwal' },
      { status: 500 }
    );
  }
}
