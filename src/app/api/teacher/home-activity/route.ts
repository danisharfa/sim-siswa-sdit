import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

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
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const teacherGroups = await prisma.group.findMany({
      where: { teacherId: teacher.userId },
      select: { id: true },
    });

    const groupIds = teacherGroups.map((item) => item.id);

    if (groupIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Belum ada kelompok bimbingan Anda',
        data: [],
      });
    }

    const data = await prisma.homeActivity.findMany({
      where: {
        groupId: {
          in: groupIds,
        },
      },
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: {
            nis: true,
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
        surah: { select: { name: true } },
        juz: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Daftar Aktivitas Rumah berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Aktivitas Rumah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar Aktivitas Rumah' },
      { status: 500 }
    );
  }
}
