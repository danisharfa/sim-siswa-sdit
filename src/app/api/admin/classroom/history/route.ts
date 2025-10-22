import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const groupedCounts = await prisma.classroomHistory.groupBy({
      by: ['classroomId', 'academicYear', 'semester'],
      _count: { studentId: true },
    });

    const classrooms = await prisma.classroom.findMany({
      where: { id: { in: groupedCounts.map((g) => g.classroomId) } },
      select: { id: true, name: true },
    });

    const classroomHistoryData = groupedCounts.map((g) => ({
      id: g.classroomId,
      name: classrooms.find((c) => c.id === g.classroomId)?.name || '',
      academicYear: g.academicYear,
      semester: g.semester,
      studentCount: g._count.studentId,
    }));

    return NextResponse.json({
      success: true,
      message: 'Riwayat kelas berhasil diambil',
      data: classroomHistoryData,
    });
  } catch (error) {
    console.error('Gagal mengambil riwayat kelas', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat kelas' },
      { status: 500 }
    );
  }
}
