import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { kelasId: string } }
) {
  try {
    const { kelasId } = params;

    const guruList = await prisma.guruKelas.findMany({
      where: { kelasId },
      include: { guru: { include: { user: true } } }, // Ambil data user guru
    });

    return NextResponse.json(guruList);
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { kelasId: string } }
) {
  try {
    const { guruId } = await req.json();
    const { kelasId } = params;

    // Cek apakah guru ada
    const guru = await prisma.guruProfile.findUnique({
      where: { id: guruId },
    });

    if (!guru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    // Tambahkan guru ke kelas
    await prisma.guruKelas.create({
      data: { guruId, kelasId },
    });

    return NextResponse.json({ message: 'Guru berhasil ditambahkan ke kelas' });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
