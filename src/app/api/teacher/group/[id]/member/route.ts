import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const id = params.id;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const isGroupBimbingan = await prisma.group.findFirst({
      where: {
        id: id,
        teacherId: teacher.userId,
      },
    });

    if (!isGroupBimbingan) {
      return NextResponse.json(
        { success: false, message: 'Kelompok ini bukan bimbingan Anda' },
        { status: 404 }
      );
    }

    const members = await prisma.studentProfile.findMany({
      where: {
        groupId: id,
      },
      orderBy: {
        nis: 'asc',
      },
      select: {
        userId: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.userId,
      nis: m.nis,
      fullName: m.user?.fullName || 'Tidak diketahui',
    }));

    return NextResponse.json({
      success: true,
      message: 'Data anggota kelompok berhasil diambil',
      data: formattedMembers,
    });
  } catch (error) {
    console.error('[GET Teacher Group Members]', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
