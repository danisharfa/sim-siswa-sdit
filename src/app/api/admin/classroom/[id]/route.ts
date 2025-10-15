import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const id = params.id;

    const { name, academicYear, semester } = await req.json();

    if (!name || !academicYear || !semester) {
      return NextResponse.json(
        { success: false, message: 'Nama kelas, tahun ajaran, dan semester wajib diisi' },
        { status: 400 }
      );
    }

    const existingClass = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, message: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedClass = await prisma.classroom.update({
      where: { id },
      data: {
        name,
        academicYear,
        semester,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil diperbarui',
      data: updatedClass,
    });
  } catch (error) {
    console.error('Gagal memperbarui data kelas:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data kelas' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const id = params.id;

    const existingClass = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, message: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.classroom.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus kelas:', error);
    return NextResponse.json({ success: false, message: 'Gagal menghapus kelas' }, { status: 500 });
  }
}
