import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, Semester } from '@prisma/client';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { currentYear, currentSemester, currentPrincipalName, schoolName, schoolAddress } = body;

    // Buat objek data update secara dinamis
    const updateData: Partial<{
      currentYear: string;
      currentSemester: Semester;
      currentPrincipalName: string;
      schoolName: string;
      schoolAddress: string;
    }> = {};

    if (currentYear !== undefined) updateData.currentYear = currentYear;
    if (currentSemester !== undefined) updateData.currentSemester = currentSemester;
    if (currentPrincipalName !== undefined) updateData.currentPrincipalName = currentPrincipalName;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (schoolAddress !== undefined) updateData.schoolAddress = schoolAddress;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data yang dikirim untuk diperbarui' },
        { status: 400 }
      );
    }

    const updated = await prisma.academicSetting.update({
      where: { id: 'default' },
      data: updateData,
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
