import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const requests = await prisma.munaqasyahRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        teacher: {
          select: {
            user: { select: { fullName: true } },
          },
        },
        juz: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('[MUNAQASYAH_REQUEST_GET]', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data' }, { status: 500 });
  }
}
