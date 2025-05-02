import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const guru = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!guru) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const groups = await prisma.group.findMany({
      where: {
        teacherGroup: {
          some: {
            teacherId: guru.id,
          },
        },
      },
      include: {
        classroom: {
          select: {
            name: true,
            academicYear: true,
          },
        },
        student: {
          select: { id: true },
        },
      },
    });

    const formattedGroups = groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      classroomName: group.classroom.name,
      classroomAcademicYear: group.classroom.academicYear,
      totalMember: group.student.length,
    }));

    return NextResponse.json({
      success: true,
      message: 'Data kelompok guru berhasil diambil',
      data: formattedGroups,
    });
  } catch (error) {
    console.error('Gagal mengambil kelompok guru:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil kelompok guru' },
      { status: 500 }
    );
  }
}
