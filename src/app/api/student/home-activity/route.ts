import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.student) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
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
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
            teacherGroups: {
              select: {
                teacher: {
                  select: {
                    user: {
                      select: { fullName: true },
                    },
                  },
                },
              },
              take: 1,
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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        classroom: true,
      },
    });
    if (!student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
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

    const body = await req.json();
    const { date, activityType, surahId, juzId, startVerse, endVerse, note } = body;

    if (!date || !activityType || !surahId || !juzId || !startVerse || !endVerse) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const HomeActivity = await prisma.homeActivity.create({
      data: {
        studentId: student.id,
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
      { success: true, message: 'Aktivitas berhasil disimpan', data: HomeActivity },
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
