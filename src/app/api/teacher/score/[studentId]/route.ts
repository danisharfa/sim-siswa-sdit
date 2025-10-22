import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ studentId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const { studentId } = await segmentData.params;

    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 });
    }

    // Cek apakah siswa ini ada dalam kelompok yang dibimbing oleh guru
    const group = await prisma.group.findFirst({
      where: {
        teacherId: teacher.userId,
        students: {
          some: { userId: studentId },
        },
      },
      include: {
        classroom: {
          select: {
            academicYear: true,
            semester: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan dalam bimbingan guru ini' },
        { status: 403 }
      );
    }

    // Query filter for period

    // Ambil data tahsin dan tahfidz berdasarkan studentId, groupId, dan period
    const tahsin = await prisma.tahsinScore.findMany({
      where: {
        studentId,
        groupId: group.id,
      },
      select: {
        id: true,
        tahsinType: true,
        topic: true,
        score: true,
        grade: true,
        description: true,
      },
    });

    const tahfidz = await prisma.tahfidzScore.findMany({
      where: {
        studentId,
        groupId: group.id,
      },
      select: {
        id: true,
        surahId: true,
        score: true,
        grade: true,
        description: true,
        surah: {
          select: {
            name: true,
          },
        },
      },
    });

    // Ambil data report untuk mendapatkan lastTahsinMaterial dan averages
    const report = await prisma.report.findUnique({
      where: {
        studentId_groupId_academicYear_semester: {
          studentId,
          groupId: group.id,
          academicYear: group.classroom.academicYear,
          semester: group.classroom.semester,
        },
      },
      select: {
        lastTahsinMaterial: true,
        tahfidzScore: true,
        tahsinScore: true,
      },
    });

    return NextResponse.json({
      tahsin,
      tahfidz,
      lastMaterial: report?.lastTahsinMaterial || null,
      averageScores: {
        tahsin: report?.tahsinScore || null,
        tahfidz: report?.tahfidzScore || null,
      },
    });
  } catch (error) {
    console.error('[GET_SCORE_ERROR]', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data nilai' },
      { status: 500 }
    );
  }
}
