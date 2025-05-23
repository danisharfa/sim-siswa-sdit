import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// untuk hapus nilai tahfidz
export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const session = await auth();
    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.tahfidzScore.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_TAHFIDZ_SCORE]', error);
    return NextResponse.json({ error: 'Gagal menghapus nilai Tahfidz' }, { status: 500 });
  }
}
