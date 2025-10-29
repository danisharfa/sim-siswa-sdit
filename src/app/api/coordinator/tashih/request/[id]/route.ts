import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, TashihRequestStatus } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;

    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
        coordinatorId: coordinator.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan tashih berhasil ${
        status === TashihRequestStatus.DITERIMA ? 'diterima' : 'ditolak'
      }`,
      data: updated,
    });
  } catch (error) {
    console.error('Gagal memperbarui status permintaan tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status permintaan tashih' },
      { status: 500 }
    );
  }
}
