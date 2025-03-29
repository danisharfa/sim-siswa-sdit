import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const { namaKelas, tahunAjaran } = await req.json();

    const existingClass = await prisma.kelas.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedClass = await prisma.kelas.update({
      where: { id },
      data: { namaKelas, tahunAjaran },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error('Error updating kelas data:', error);

    return NextResponse.json(
      { error: 'Gagal mengedit kelas' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    const existingClass = await prisma.kelas.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus kelas jika ditemukan
    await prisma.kelas.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Kelas berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kelas' },
      { status: 500 }
    );
  }
}
