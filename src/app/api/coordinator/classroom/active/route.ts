import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        academicYear: true,
        semester: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil kelas aktif',
      data: classrooms,
    });
  } catch (error) {
    console.error('[GET /coordinator/classroom/active]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil kelas aktif' },
      { status: 500 }
    );
  }
}
