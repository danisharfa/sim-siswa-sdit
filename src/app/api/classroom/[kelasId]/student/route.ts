import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ kelasId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
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
