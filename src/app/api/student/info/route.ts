import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        group: {
          include: {
            classroom: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student profile tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get current academic setting
    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    // Build current period info
    const currentPeriod = {
      academicYear: academicSetting?.currentYear || 'Unknown',
      semester: academicSetting?.currentSemester || 'GANJIL',
      label: academicSetting
        ? `${academicSetting.currentYear} ${
            academicSetting.currentSemester === 'GANJIL' ? 'Ganjil' : 'Genap'
          }`
        : 'Unknown Period',
    };

    // Get teachers from current group
    const teachers = student.group?.teacher
      ? [
          {
            id: student.group.teacher.userId,
            name: student.group.teacher.user.fullName,
          },
        ]
      : [];

    // Build student info
    const studentInfo = {
      id: student.userId,
      name: student.user.fullName,
      nis: student.nis,
      currentGroup: student.group
        ? {
            id: student.group.id,
            name: student.group.name,
            className: student.group.classroom.name,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        studentInfo,
        currentPeriod,
        teachers,
      },
    });
  } catch (error) {
    console.error('Gagal mengambil Informasi Siswa:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil Informasi Siswa' },
      { status: 500 }
    );
  }
}
