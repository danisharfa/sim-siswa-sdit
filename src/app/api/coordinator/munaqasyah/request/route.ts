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

    const data = await prisma.munaqasyahRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        scheduleRequests: true,
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
    });

    return NextResponse.json({
      success: true,
      message: 'Permintaan Munaqasyah berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil Permintaan Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Permintaan Munaqasyah' },
      { status: 500 }
    );
  }
}
