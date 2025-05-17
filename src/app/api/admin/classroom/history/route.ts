// File: src/app/api/admin/classroom/history/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const history = await prisma.classroomHistory.findMany({
      orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }, { classroom: { name: 'asc' } }],
      include: {
        classroom: true,
        student: {
          select: {
            id: true,
            nis: true,
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    type StudentItem = {
      id: string;
      nis: string;
      fullName: string;
    };

    type GroupedClassroom = {
      id: string;
      name: string;
      academicYear: string;
      semester: string;
      students: StudentItem[];
    };

    // acc: accumulator; curr: currentValue
    const initialValue = {} as Record<string, GroupedClassroom>;
    const grouped = history.reduce((acc, curr) => {
      const key = `${curr.classroom.name}-${curr.academicYear}-${curr.semester}`;
      if (!acc[key]) {
        acc[key] = {
          id: curr.classroomId,
          name: curr.classroom.name,
          academicYear: curr.academicYear,
          semester: curr.semester,
          students: [],
        };
      }
      acc[key].students.push({
        id: curr.student.id,
        nis: curr.student.nis,
        fullName: curr.student.user.fullName,
      });
      return acc;
    }, initialValue);

    return NextResponse.json({
      success: true,
      message: 'Riwayat kelas berhasil diambil',
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error('[GET /classroom/history]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat kelas' },
      { status: 500 }
    );
  }
}
