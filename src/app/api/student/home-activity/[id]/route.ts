import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segment: { params: Params }) {
  try {
    const { id } = await segment.params;
    const session = await auth();

    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const activity = await prisma.homeActivity.findUnique({
      where: { id },
      select: { studentId: true },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, message: 'Aktivitas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi kepemilikan aktivitas
    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!student || activity.studentId !== student.id) {
      return NextResponse.json(
        { success: false, message: 'Aktivitas bukan milik Anda' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { activityType, juzName, surahName, startVerse, endVerse, note } = body;

    if (!activityType || !juzName || !surahName || !startVerse || !endVerse) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const [juz, surah] = await Promise.all([
      prisma.juz.findFirst({ where: { name: juzName } }),
      prisma.surah.findFirst({ where: { name: surahName } }),
    ]);

    if (!juz || !surah) {
      return NextResponse.json(
        { success: false, message: 'Juz atau Surah tidak ditemukan' },
        { status: 400 }
      );
    }

    const updated = await prisma.homeActivity.update({
      where: { id },
      data: {
        activityType,
        juzId: juz.id,
        surahId: surah.id,
        startVerse,
        endVerse,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[HOME_ACTIVITY_PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui aktivitas' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segment: { params: Params }) {
  try {
    const { id } = await segment.params;
    const session = await auth();

    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const activity = await prisma.homeActivity.findUnique({
      where: { id },
      select: { studentId: true },
    });

    if (!activity) {
      return NextResponse.json(
        { success: false, message: 'Aktivitas tidak ditemukan' },
        { status: 404 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!student || activity.studentId !== student.id) {
      return NextResponse.json(
        { success: false, message: 'Aktivitas bukan milik Anda' },
        { status: 403 }
      );
    }

    await prisma.homeActivity.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Aktivitas berhasil dihapus' });
  } catch (error) {
    console.error('[HOME_ACTIVITY_DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus aktivitas' },
      { status: 500 }
    );
  }
}
