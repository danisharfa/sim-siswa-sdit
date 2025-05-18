import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Semester } from '@prisma/client';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { currentYear, currentSemester } = body;

    if (!currentYear || !currentSemester) {
      return NextResponse.json(
        { success: false, message: 'Tahun ajaran dan semester wajib diisi' },
        { status: 400 }
      );
    }

    const currentSetting = await prisma.academicSetting.findUnique({
      where: { id: 'default' },
    });

    if (
      currentSetting &&
      currentSetting.currentYear === currentYear &&
      currentSetting.currentSemester === currentSemester
    ) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada perubahan pada pengaturan',
        data: currentSetting,
      });
    }

    const updated = await prisma.academicSetting.update({
      where: { id: 'default' },
      data: {
        currentYear,
        currentSemester: currentSemester as Semester,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Academic setting berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Gagal memperbarui AcademicSetting:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui AcademicSetting' },
      { status: 500 }
    );
  }
}
