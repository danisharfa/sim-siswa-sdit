import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
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
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    const data = await prisma.group.findMany({
      where: {
        teacherId: teacher.userId,
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
          select: { userId: true },
        },
      },
    });

    const formattedData = data.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      classroomName: group.classroom.name,
      classroomAcademicYear: group.classroom.academicYear,
      classroomSemester: group.classroom.semester,
      totalMember: group.students.length,
    }));

    return NextResponse.json({
      success: true,
      message: 'Daftar Kelompok berhasil diambil',
      data: formattedData,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Kelompok:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar Kelompok' },
      { status: 500 }
    );
  }
}
