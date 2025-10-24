import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;
    const { passed, notes } = await req.json();

    if (typeof passed !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Field status kelulusan harus diisi' },
        { status: 400 }
      );
    }

    const existingResult = await prisma.tashihResult.findUnique({
      where: { id },
      include: {
        tashihRequest: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil tashih tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedResult = await prisma.tashihResult.update({
      where: { id },
      data: {
        passed,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hasil Tashih berhasil diperbarui',
      data: updatedResult,
    });
  } catch (error) {
    console.error('Gagal memperbarui Hasil Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui Hasil Tashih' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const existingResult = await prisma.tashihResult.findUnique({
      where: { id },
      include: {
        tashihRequest: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    console.log('Existing result:', {
      id: existingResult?.id,
      studentName: existingResult?.tashihRequest.student.user.fullName,
      passed: existingResult?.passed,
    });

    if (!existingResult) {
      return NextResponse.json(
        { success: false, message: 'Hasil tashih tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.tashihResult.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Hasil Tashih berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus Hasil Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus Hasil Tashih' },
      { status: 500 }
    );
  }
}
