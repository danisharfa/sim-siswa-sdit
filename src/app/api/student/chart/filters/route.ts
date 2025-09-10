import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        group: {
          include: {
            classroom: true,
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

    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    const periodsSet = new Set();

    if (student.group) {
      const periodKey = `${student.group.classroom.academicYear}|${student.group.classroom.semester}`;
      periodsSet.add(periodKey);
    }

    const groupHistories = await prisma.groupHistory.findMany({
      where: {
        studentId: student.userId,
      },
      distinct: ['academicYear', 'semester'],
      include: {
        group: {
          include: {
            classroom: true,
          },
        },
      },
    });

    groupHistories.forEach((gh) => {
      const periodKey = `${gh.academicYear}|${gh.semester}`;
      periodsSet.add(periodKey);
    });

    const periods = Array.from(periodsSet)
      .map((period) => {
        const [academicYear, semester] = (period as string).split('|');

        // Cari group untuk periode ini
        let groupInfo = null;

        // Cek current group
        if (
          student.group &&
          student.group.classroom.academicYear === academicYear &&
          student.group.classroom.semester === semester
        ) {
          groupInfo = {
            id: student.group.id,
            name: student.group.name,
            className: student.group.classroom.name,
          };
        } else {
          // Cek group history
          const historyGroup = groupHistories.find(
            (gh) => gh.academicYear === academicYear && gh.semester === semester
          );
          if (historyGroup) {
            groupInfo = {
              id: historyGroup.group.id,
              name: historyGroup.group.name,
              className: historyGroup.group.classroom.name,
            };
          }
        }

        const baseLabel = `${academicYear} ${semester === 'GANJIL' ? 'Ganjil' : 'Genap'}`;
        const groupLabel = groupInfo ? ` | ${groupInfo.name} - ${groupInfo.className}` : '';

        return {
          value: `${encodeURIComponent(academicYear)}-${semester}`,
          label: baseLabel + groupLabel,
          academicYear,
          semester,
          groupInfo,
        };
      })
      .sort((a, b) => {
        if (a.academicYear !== b.academicYear) {
          return b.academicYear.localeCompare(a.academicYear);
        }
        return a.semester === 'GANJIL' ? -1 : 1;
      });

    const defaultPeriod = academicSetting
      ? `${encodeURIComponent(academicSetting.currentYear)}-${academicSetting.currentSemester}`
      : periods[0]?.value || '';

    console.log('Student filter data:', {
      studentId: student.userId,
      studentName: student.user.fullName,
      periods,
      defaultPeriod,
    });

    return NextResponse.json({
      periods,
      defaultPeriod,
      studentInfo: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching student filter data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
