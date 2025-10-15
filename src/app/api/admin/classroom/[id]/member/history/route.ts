import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const classroomId = params.id;

    if (!classroomId) {
      return NextResponse.json(
        { success: false, message: 'classroomId is required' },
        { status: 400 }
      );
    }

    const classroomHistories = await prisma.classroomHistory.findMany({
      where: { classroomId },
      include: {
        student: {
          select: {
            userId: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
      orderBy: {
        student: {
          nis: 'asc',
        },
      },
    });

    const formattedSiswa = classroomHistories.map((history) => ({
      id: history.student.userId,
      nis: history.student.nis,
      fullName: history.student.user.fullName,
    }));

    return NextResponse.json({
      success: true,
      message: 'Riwayat siswa berhasil diambil',
      data: formattedSiswa,
    });
  } catch (error) {
    console.error('Error fetching classroom history members:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
