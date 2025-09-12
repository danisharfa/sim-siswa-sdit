import { NextRequest, NextResponse } from 'next/server';
import { getStudentReportData } from '@/lib/data/teacher/report';
import { auth } from '@/auth';
import { Role, AssessmentPeriod } from '@prisma/client';

type Params = Promise<{ studentId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await segmentData.params;
    const { studentId } = params;

    const url = new URL(req.url);
    const groupId = url.searchParams.get('groupId');
    const period = (url.searchParams.get('period') as AssessmentPeriod) || 'FINAL';

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const data = await getStudentReportData(studentId, groupId, period);

    if (!data) {
      return NextResponse.json({ error: 'Report data not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[TEACHER_REPORT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
