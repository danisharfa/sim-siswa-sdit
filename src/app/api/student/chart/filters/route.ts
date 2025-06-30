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

    // Get student profile
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
      return NextResponse.json({ success: false, error: 'Student profile tidak ditemukan' }, { status: 404 });
    }

    // Get academic setting for default period
    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    // Get all periods where this student has been active
    const periodsSet = new Set();

    // From current group
    if (student.group) {
      const periodKey = `${student.group.classroom.academicYear}|${student.group.classroom.semester}`;
      periodsSet.add(periodKey);
    }

    // From group history
    const groupHistories = await prisma.groupHistory.findMany({
      where: {
        studentId: student.id,
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

    // Format periods
    const periods = Array.from(periodsSet)
      .map((period) => {
        const [academicYear, semester] = (period as string).split('|');
        return {
          value: `${encodeURIComponent(academicYear)}-${semester}`,
          label: `${academicYear} ${semester === 'GANJIL' ? 'Ganjil' : 'Genap'}`,
          academicYear,
          semester,
        };
      })
      .sort((a, b) => {
        // Sort by year first, then semester (Ganjil before Genap)
        if (a.academicYear !== b.academicYear) {
          return b.academicYear.localeCompare(a.academicYear);
        }
        return a.semester === 'GANJIL' ? -1 : 1;
      });

    // Default period from academic setting or latest period
    const defaultPeriod = academicSetting
      ? `${encodeURIComponent(academicSetting.currentYear)}-${academicSetting.currentSemester}`
      : periods[0]?.value || '';

    console.log('Student filter data:', {
      studentId: student.id,
      studentName: student.user.fullName,
      periods,
      defaultPeriod,
    });

    return NextResponse.json({
      periods,
      defaultPeriod,
      studentInfo: {
        id: student.id,
        name: student.user.fullName,
        nis: student.nis,
        currentGroup: student.group ? {
          id: student.group.id,
          name: student.group.name,
          className: student.group.classroom.name,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching student filter data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}