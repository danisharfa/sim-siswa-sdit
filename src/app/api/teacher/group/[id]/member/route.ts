import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;

  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const guru = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const isGroupBimbingan = await prisma.teacherGroup.findFirst({
      where: {
        groupId: id,
        teacherId: guru.id,
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
        id: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
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
