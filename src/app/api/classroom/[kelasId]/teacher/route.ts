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
