import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { MunaqasyahRequestStatus, Role } from '@prisma/client';

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

    if (![MunaqasyahRequestStatus.DITERIMA, MunaqasyahRequestStatus.DITOLAK].includes(status)) {
      return NextResponse.json({ success: false, message: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.munaqasyahRequest.update({
      where: { id },
      data: {
        status,
        handledByCoordinatorId: coordinator.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan berhasil ${
        status === MunaqasyahRequestStatus.DITERIMA ? 'diterima' : 'ditolak'
      }`,
      data: updated,
    });
  } catch (error) {
    console.error('[MUNAQASYAH_REQUEST_PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui status' },
      { status: 500 }
    );
  }
}
