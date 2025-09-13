import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: Request, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const groupId = params.id;

    const session = await auth();

    if (!session?.user || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coordinator) {
      return NextResponse.json(
        { success: false, error: 'Koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil semua siswa yang pernah ada di group history untuk groupId ini
    const groupHistories = await prisma.groupHistory.findMany({
      where: {
        groupId: groupId,
      },
      distinct: ['studentId'],
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        group: {
          include: {
            classroom: {
              select: {
                academicYear: true,
                semester: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc',
          },
        },
      },
    });

    const students = groupHistories.map((gh) => ({
      id: gh.student.userId,
      nis: gh.student.nis,
      fullName: gh.student.user.fullName,
      group: {
        id: gh.group.id,
        name: gh.group.name,
        classroom: gh.group.classroom,
      },
    }));

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching coordinator group history members:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data anggota kelompok riwayat' },
      { status: 500 }
    );
  }
}
