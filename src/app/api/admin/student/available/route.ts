import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { StudentStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        classroomId: null,
        status: StudentStatus.AKTIF,
      },
      orderBy: { nis: 'asc' },
      select: {
        id: true,
        nis: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      nis: s.nis,
      fullName: s.user.fullName,
    }));

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil siswa yang belum memiliki kelas',
      data: formatted,
    });
  } catch (error) {
    console.error('Gagal mengambil siswa tanpa kelas:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data siswa' },
      { status: 500 }
    );
  }
}
