import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coordinator) {
      return NextResponse.json({ success: false, error: 'Koordinator tidak ditemukan' }, { status: 404 });
    }

    const academicSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    // 1. Ambil periods dari semua classroom yang ada
    const allClassrooms = await prisma.classroom.findMany({
      include: {
        groups: true,
      },
    });

    // 2. Ambil periods dari group history
    const groupHistories = await prisma.groupHistory.findMany({
      distinct: ['academicYear', 'semester', 'groupId'],
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

    // Dari classroom aktif
    allClassrooms.forEach((classroom) => {
      const periodKey = `${classroom.academicYear}|${classroom.semester}`;
      periodsSet.add(periodKey);

      classroom.groups.forEach((group) => {
        const groupKey = `${group.id}-${periodKey}`;
        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, {
            id: group.id,
            name: group.name,
            classroomName: classroom.name,
            academicYear: classroom.academicYear,
            semester: classroom.semester,
            period: periodKey,
            label: `${group.name} - ${classroom.name}`,
          });
        }
      });
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

    console.log('Coordinator filter data:', { periods, groups: allGroups, defaultPeriod });

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