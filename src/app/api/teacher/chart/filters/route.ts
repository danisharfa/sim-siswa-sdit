import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    // Ambil academic setting untuk default periode
    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    // 1. Ambil periods dari grup aktif
    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.userId },
      include: {
        classroom: true,
      },
    });

    // 2. Ambil periods dari group history
    const groupHistories = await prisma.groupHistory.findMany({
      where: { teacherId: teacher.userId },
      include: {
        group: {
          include: {
            classroom: true,
          },
        },
      },
    });

    // 3. Kombinasikan dan deduplicate periods
    const periodsSet = new Set();
    const groupsMap = new Map();

    // Dari grup aktif
    groups.forEach((group) => {
      const periodKey = `${group.classroom.academicYear}|${group.classroom.semester}`;
      periodsSet.add(periodKey);

      const groupKey = `${group.id}-${periodKey}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: group.id,
          name: group.name,
          classroomName: group.classroom.name,
          academicYear: group.classroom.academicYear,
          semester: group.classroom.semester,
          period: periodKey,
          label: `${group.name} - ${group.classroom.name}`,
        });
      }
    });

    // Dari group history
    groupHistories.forEach((gh) => {
      const periodKey = `${gh.academicYear}|${gh.semester}`;
      periodsSet.add(periodKey);

      const groupKey = `${gh.group.id}-${periodKey}`;
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          id: gh.group.id,
          name: gh.group.name,
          classroomName: gh.group.classroom.name,
          academicYear: gh.academicYear,
          semester: gh.semester,
          period: periodKey,
          label: `${gh.group.name} - ${gh.group.classroom.name}`,
        });
      }
    });

    // 4. Format periods
    const periods = Array.from(periodsSet)
      .map((period) => {
        const [academicYear, semester] = (period as string).split('|');
        return {
          value: period as string,
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

    // 5. Get all groups
    const allGroups = Array.from(groupsMap.values());

    // Default period dari academic setting
    const defaultPeriod = academicSetting
      ? `${academicSetting.currentYear}|${academicSetting.currentSemester}`
      : periods[0]?.value || '';

    console.log('Filter data:', { periods, groups: allGroups, defaultPeriod }); // Debug log

    return NextResponse.json({
      periods,
      groups: allGroups,
      defaultPeriod,
    });
  } catch (error) {
    console.error('Error fetching filter data:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
