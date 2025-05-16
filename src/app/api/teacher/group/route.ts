import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const groups = await prisma.group.findMany({
      where: {
        teacherGroups: {
          some: {
            teacherId: teacher.id,
          },
        },
      },
      include: {
        classroom: {
          select: {
            name: true,
            academicYear: true,
            semester: true,
          },
        },
        students: {
          select: { id: true },
        },
      },
    });

    const formattedGroups = groups.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      classroomName: group.classroom.name,
      classroomAcademicYear: group.classroom.academicYear,
      classroomSemester: group.classroom.semester,
      totalMember: group.students.length,
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
