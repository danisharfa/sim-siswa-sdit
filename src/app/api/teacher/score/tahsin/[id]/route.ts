import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

// untuk hapus nilai tahsin
export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.tahsinScore.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_TAHSIN_SCORE]', error);
    return NextResponse.json({ error: 'Gagal menghapus nilai Tahsin' }, { status: 500 });
  }
}
