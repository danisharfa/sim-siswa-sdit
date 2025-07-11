import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teachers = await prisma.teacherProfile.findMany({
      include: { user: { select: { id: true, fullName: true } } },
    });

    const examiners = teachers.map((t) => ({
      id: t.id,
      name: t.user.fullName,
      role: 'teacher' as const,
    }));

    return NextResponse.json({ success: true, data: examiners });
  } catch (error) {
    console.error('[GET_MUNAQASYAH_EXAMINER]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil daftar penguji' },
      { status: 500 }
    );
  }
}
