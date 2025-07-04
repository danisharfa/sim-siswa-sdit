import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
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
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const semester = searchParams.get('semester');
    const period = searchParams.get('period');
    const search = searchParams.get('search');

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: Record<string, any> = {
      teacherId: teacher.id,
    };

    if (groupId && groupId !== 'all') {
      whereClause.groupId = groupId;
    }

    if (studentId && studentId !== 'all') {
      whereClause.studentId = studentId;
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (month && month !== 'all') {
      const monthNum = parseInt(month);
      whereClause.startDate = {
        gte: new Date(new Date().getFullYear(), monthNum - 1, 1),
        lt: new Date(new Date().getFullYear(), monthNum, 1),
      };
    }

    if (semester === 'current') {
      // Get current academic setting
      const academicSetting = await prisma.academicSetting.findFirst();
      if (academicSetting) {
        whereClause.group = {
          classroom: {
            academicYear: academicSetting.currentYear,
            semester: academicSetting.currentSemester,
          },
        };
      }
    } else if (semester && semester !== 'all') {
      whereClause.group = {
        classroom: {
          semester: semester,
        },
      };
    }

    // Handle period filter (academicYear-semester format)
    if (period && period !== 'all') {
      const [year, semesterPeriod] = period.split('-');
      if (year && semesterPeriod) {
        whereClause.group = {
          ...whereClause.group,
          classroom: {
            academicYear: year,
            semester: semesterPeriod,
          },
        };
      }
    }

    if (search) {
      whereClause.OR = [
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          student: {
            user: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Fetch targets with relations
    const targets = await prisma.weeklyTarget.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        group: {
          include: {
            classroom: {
              select: {
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
        surahStart: {
          select: {
            id: true,
            name: true,
          },
        },
        surahEnd: {
          select: {
            id: true,
            name: true,
          },
        },
        wafa: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    console.error('[API_TEACHER_TARGET_HISTORY]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil riwayat target',
      },
      { status: 500 }
    );
  }
}
