import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Body request tidak valid' },
        { status: 400 }
      );
    }

    const { namaKelas, tahunAjaran } = body;

    if (!namaKelas || !tahunAjaran) {
      return NextResponse.json(
        { error: 'Nama kelas dan tahun ajaran wajib diisi' },
        { status: 400 }
      );
    }

    const updatedClass = await prisma.kelas.update({
      where: { id: params.id },
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
