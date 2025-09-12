import { NextRequest, NextResponse } from 'next/server';
import { fetchReportData } from '@/lib/data/student/report';
import { AssessmentPeriod } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as AssessmentPeriod) || 'FINAL';

    // Validate period
    if (!['MID_SEMESTER', 'FINAL'].includes(period)) {
      return NextResponse.json({ error: 'Invalid assessment period' }, { status: 400 });
    }

    const data = await fetchReportData(period);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET_STUDENT_REPORT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
