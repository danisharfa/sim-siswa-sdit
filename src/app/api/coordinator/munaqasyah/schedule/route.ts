import { NextRequest, NextResponse } from 'next/server';
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
        examiner: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        coordinator: {
          select: {
            userId: true,
            user: { select: { fullName: true } },
          },
        },
        scheduleRequests: {
          select: {
            requestId: true,
            request: {
              select: {
                batch: true,
                stage: true,
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
                    id: true,
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
                juz: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('[MUNAQASYAH_SCHEDULE_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil jadwal' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
    const { date, sessionName, startTime, endTime, location, examinerId, requestIds } = body;

    if (
      !date ||
      !sessionName ||
      !startTime ||
      !endTime ||
      !location ||
      !Array.isArray(requestIds) ||
      requestIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap atau tidak valid' },
        { status: 400 }
      );
    }

    // Normalisasi date ke rentang harian (tanpa jam)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existingSchedule = await prisma.munaqasyahSchedule.findFirst({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        sessionName,
        startTime,
        endTime,
        location,
        examinerId,
      },
    });

    let schedule;

    if (existingSchedule) {
      // Jika jadwal sudah ada, tambahkan request ke jadwal tersebut
      schedule = await prisma.munaqasyahSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          scheduleRequests: {
            create: requestIds.map((id: string) => ({
              request: { connect: { id } },
            })),
          },
        },
      });
    } else {
      // Jika belum ada, buat jadwal baru
      await prisma.munaqasyahSchedule.create({
        data: {
          date: new Date(date),
          sessionName,
          startTime,
          endTime,
          location,
          coordinatorId: coordinator.userId,
          ...(examinerId && { examinerId }), // ← tetap valid
          scheduleRequests: {
            create: requestIds.map((id: string) => ({
              request: { connect: { id } },
            })),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Jadwal berhasil disimpan',
      data: schedule,
    });
  } catch (error) {
    console.error('[MUNAQASYAH_SCHEDULE_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat jadwal' },
      { status: 500 }
    );
  }
}
