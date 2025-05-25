import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, Semester } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const histories = await prisma.groupHistory.findMany({
      orderBy: [{ academicYear: 'desc' }, { semester: 'desc' }, { group: { name: 'asc' } }],
      include: {
        group: {
          include: {
            classroom: true,
          },
        },
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

    type GroupedHistory = {
      groupId: string;
      groupName: string;
      classroomName: string;
      academicYear: string;
      semester: Semester;
      students: StudentItem[];
    };

    const grouped = histories.reduce((acc, curr) => {
      const key = `${curr.groupId}-${curr.academicYear}-${curr.semester}`;
      if (!acc[key]) {
        acc[key] = {
          groupId: curr.groupId,
          groupName: curr.group.name,
          classroomName: curr.group.classroom.name,
          academicYear: curr.academicYear,
          semester: curr.semester as Semester,
          students: [],
        };
      }
      acc[key].students.push({
        id: curr.student.id,
        nis: curr.student.nis,
        fullName: curr.student.user.fullName,
      });
      return acc;
    }, {} as Record<string, GroupedHistory>);

    return NextResponse.json({
      success: true,
      message: 'Riwayat kelompok berhasil diambil',
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error('[GET /coordinator/group/history]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat kelompok' },
      { status: 500 }
    );
  }
}
