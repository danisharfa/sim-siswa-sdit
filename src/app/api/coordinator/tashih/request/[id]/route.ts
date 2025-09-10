import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, TashihRequestStatus } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const id = params.id;

    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const coordinator = await prisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!coordinator) {
      return NextResponse.json(
        { success: false, message: 'Koordinator tidak ditemukan' },
        { status: 404 }
      );
    }

    const { status } = await req.json();

    if (![TashihRequestStatus.DITERIMA, TashihRequestStatus.DITOLAK].includes(status)) {
      return NextResponse.json({ success: false, message: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.tashihRequest.update({
      where: { id },
      data: {
        status,
        handledByCoordinatorId: coordinator.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan ujian berhasil di${
        status === TashihRequestStatus.DITERIMA ? 'terima' : 'tolak'
      }`,
      data: updated,
    });
  } catch (error) {
    console.error('[EXAM_REQUEST_UPDATE]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status permintaan' },
      { status: 500 }
    );
  }
}
