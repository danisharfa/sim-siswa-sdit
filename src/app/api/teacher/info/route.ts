import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface TeacherInfo {
  id: string;
  name: string;
  nip: string;
  groups: {
    id: string;
    name: string;
    className: string;
    studentCount: number;
  }[];
}

interface TeacherInfoResponse {
  teacherInfo: TeacherInfo;
  currentPeriod: {
    academicYear: string;
    semester: string;
    label: string;
  };
  totalStudents: number;
  totalGroups: number;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Teacher not found' }, { status: 404 });
    }

    // Get academic setting for current period
    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    if (!academicSetting) {
      return NextResponse.json(
        { success: false, error: 'No academic setting found' },
        { status: 404 }
      );
    }

    // Get teacher's groups for current period with student count
    const teacherGroups = await prisma.teacherGroup.findMany({
      where: { teacherId: teacher.id },
      include: {
        group: {
          include: {
            classroom: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    // Filter groups for current active period
    const currentGroups = teacherGroups.filter(
      (tg) =>
        tg.group.classroom.academicYear === academicSetting.currentYear &&
        tg.group.classroom.semester === academicSetting.currentSemester &&
        tg.group.classroom.isActive
    );

    // Transform groups data
    const groupsData = currentGroups.map((tg) => ({
      id: tg.group.id,
      name: tg.group.name,
      className: tg.group.classroom.name,
      studentCount: tg.group._count.students,
    }));

    // Calculate totals
    const totalGroups = currentGroups.length;
    const totalStudents = currentGroups.reduce((sum, tg) => sum + tg.group._count.students, 0);

    const teacherInfo: TeacherInfo = {
      id: teacher.id,
      name: teacher.user.fullName,
      nip: teacher.nip,
      groups: groupsData,
    };

    const response: TeacherInfoResponse = {
      teacherInfo,
      currentPeriod: {
        academicYear: academicSetting.currentYear,
        semester: academicSetting.currentSemester,
        label: `${academicSetting.currentYear} - ${academicSetting.currentSemester}`,
      },
      totalStudents,
      totalGroups,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
