import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        coordinator: true,
      },
    });

    if (!user || user.role !== 'coordinator') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const currentSetting = await prisma.academicSetting.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!currentSetting) {
      return NextResponse.json(
        { success: false, error: 'No academic setting found' },
        { status: 404 }
      );
    }

    const coordinatorInfo = {
      id: user.id,
      name: user.fullName,
      nip: user.coordinator?.nip || '-',
    };

    const response = {
      coordinatorInfo,
      currentPeriod: {
        academicYear: currentSetting.currentYear,
        semester: currentSetting.currentSemester,
        label: `${currentSetting.currentYear} - Semester ${currentSetting.currentSemester}`,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in coordinator info API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
