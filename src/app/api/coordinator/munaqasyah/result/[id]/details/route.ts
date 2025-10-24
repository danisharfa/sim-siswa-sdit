import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const result = await prisma.munaqasyahResult.findUnique({
      where: { id: id },
      include: {
        tasmiScores: true,
        munaqasyahScores: true,
      },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Hasil munaqasyah tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tasmiDetails: result.tasmiScores,
      munaqasyahDetails: result.munaqasyahScores,
    });
  } catch (error) {
    console.error('Error fetching munaqasyah result details:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
