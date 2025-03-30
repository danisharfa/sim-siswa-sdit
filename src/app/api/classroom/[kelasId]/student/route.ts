import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ kelasId: string }>;

export async function GET(segmentData: { params: Params }) {
  const params = await segmentData.params;
  const kelasId = params.kelasId;

  if (!kelasId) {
    return NextResponse.json({ error: 'kelasId is required' }, { status: 400 });
  }

  try {
    const siswaList = await prisma.siswaProfile.findMany({
      where: { kelasId: kelasId },
      include: { user: true },
    });

    return NextResponse.json(siswaList);
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const kelasId = params.kelasId;

    const { siswaId } = await req.json();

    const siswa = await prisma.siswaProfile.findUnique({
      where: { id: siswaId },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.siswaProfile.update({
      where: { id: siswaId },
      data: { kelasId },
    });

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan ke kelas',
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
