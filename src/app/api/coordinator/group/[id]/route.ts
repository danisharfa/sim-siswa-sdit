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

    const { groupName } = await req.json();

    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: { name: groupName },
    });

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil diperbarui',
      data: updatedGroup,
    });
  } catch (error) {
    console.error('Error updating kelompok data:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengedit kelompok' },
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

    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { success: false, message: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.group.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: 'Kelompok berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting kelompok:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus kelompok' },
      { status: 500 }
    );
  }
}
