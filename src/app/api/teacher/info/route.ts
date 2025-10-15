import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });
    }

    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    if (!academicSetting) {
      return NextResponse.json(
        { success: false, error: 'No academic setting found' },
        { status: 404 }
      );
    }

    const teacherInfo = {
      id: teacher.userId,
      name: teacher.user.fullName,
      nip: teacher.nip,
    };

    const response = {
      teacherInfo,
      currentPeriod: {
        academicYear: academicSetting.currentYear,
        semester: academicSetting.currentSemester,
        label: `${academicSetting.currentYear} - ${academicSetting.currentSemester}`,
      },
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
