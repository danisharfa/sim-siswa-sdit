import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    const activities = await prisma.homeActivity.findMany({
      where: { studentId: student.userId },
      orderBy: { date: 'desc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
            teacher: {
              select: {
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
        juz: { select: { name: true } },
        surah: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('[HOME_ACTIVITY_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan mengambil data' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { date, activityType, surahId, juzId, startVerse, endVerse, note } = await req.json();

    // ===== BASIC VALIDATION =====
    if (!date || !activityType || !surahId || !juzId || !startVerse || !endVerse) {
      return NextResponse.json(
        { success: false, message: 'Data dasar tidak lengkap' },
        { status: 400 }
      );
    }

    // ===== NUMERIC VALIDATION =====
    if (typeof startVerse !== 'number' || startVerse < 1) {
      return NextResponse.json(
        { success: false, message: 'Ayat mulai harus berupa angka positif' },
        { status: 400 }
      );
    }
    if (typeof endVerse !== 'number' || endVerse < 1) {
      return NextResponse.json(
        { success: false, message: 'Ayat selesai harus berupa angka positif' },
        { status: 400 }
      );
    }
    if (startVerse > endVerse) {
      return NextResponse.json(
        { success: false, message: 'Ayat mulai tidak boleh lebih besar dari ayat selesai' },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        classroom: true,
      },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!student.classroom) {
      return NextResponse.json(
        { success: false, message: 'Siswa belum terdaftar di kelas aktif' },
        { status: 400 }
      );
    }

    if (!student.groupId) {
      return NextResponse.json(
        { success: false, message: 'Siswa belum terdaftar di grup aktif' },
        { status: 400 }
      );
    }

    // ===== REFERENCE VALIDATION =====
    const juz = await prisma.juz.findUnique({ where: { id: juzId } });
    if (!juz) {
      return NextResponse.json({ success: false, message: 'Juz tidak ditemukan' }, { status: 400 });
    }

    const surah = await prisma.surah.findUnique({ where: { id: surahId } });
    if (!surah) {
      return NextResponse.json(
        { success: false, message: 'Surah tidak ditemukan' },
        { status: 400 }
      );
    }

    // ===== VERSE COUNT VALIDATION =====
    if (endVerse > surah.verseCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Ayat selesai melebihi jumlah ayat surah (${surah.verseCount})`,
        },
        { status: 400 }
      );
    }

    const homeActivity = await prisma.homeActivity.create({
      data: {
        studentId: student.userId,
        groupId: student.groupId,
        date: new Date(date),
        activityType,
        juzId,
        surahId,
        startVerse,
        endVerse,
        note,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Aktivitas berhasil disimpan', data: homeActivity },
      { status: 201 }
    );
  } catch (error) {
    console.error('[HOME_ACTIVITY_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menyimpan data' },
      { status: 500 }
    );
  }
}
