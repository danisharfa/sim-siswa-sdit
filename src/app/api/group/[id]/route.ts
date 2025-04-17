import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const { nama } = await req.json();

    const existingGroup = await prisma.kelompok.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedGroup = await prisma.kelompok.update({
      where: { id },
      data: { nama },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating kelompok data:', error);

    return NextResponse.json(
      { error: 'Gagal mengedit kelompok' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const existingGroup = await prisma.kelompok.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Kelompok tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.kelompok.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Kelompok berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting kelompok:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kelompok' },
      { status: 500 }
    );
  }
}
