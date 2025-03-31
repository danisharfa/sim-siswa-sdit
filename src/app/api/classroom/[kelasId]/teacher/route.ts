import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ kelasId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;

    const guruList = await prisma.guruKelas.findMany({
      where: { kelasId },
      include: { guru: { include: { user: true } } },
    });

    return NextResponse.json(guruList);
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;
    const { guruId } = await req.json();

    const guru = await prisma.guruProfile.findUnique({
      where: { id: guruId },
    });

    if (!guru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.guruKelas.create({
      data: { guruId, kelasId },
    });

    return NextResponse.json({ message: 'Guru berhasil ditambahkan ke kelas' });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
