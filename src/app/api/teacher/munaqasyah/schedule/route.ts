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

    const data = await prisma.munaqasyahSchedule.findMany({
      orderBy: { date: 'desc' },
      where: {
        OR: [
          { examinerId: teacher.userId },
          {
            scheduleRequests: {
              some: {
                request: {
                  teacherId: teacher.userId,
                },
              },
            },
          },
        ],
      },
      include: {
        examiner: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        coordinator: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        scheduleRequests: {
          include: {
            request: {
              select: {
                id: true,
                batch: true,
                stage: true,
                juz: { select: { name: true } },
                student: {
                  select: {
                    nis: true,
                    user: { select: { fullName: true } },
                  },
                },
                teacher: {
                  select: {
                    nip: true,
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil jadwal Munaqasyah Siswa Bimbingan',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil jadwal Munaqasyah Siswa Bimbingan:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil jadwal Munaqasyah Siswa Bimbingan' },
      { status: 500 }
    );
  }
}
