import { NextResponse } from 'next/server';
import { fetchReportData } from '@/lib/data/student/report';

export async function GET() {
  try {
    const data = await fetchReportData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET_STUDENT_REPORT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
