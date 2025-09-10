import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type Params = Promise<{ studentId: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const params = await segmentData.params;
    const studentId = params.studentId;

    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Profil guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: {
        groupId: true,
        group: {
          select: {
            id: true,
            classroom: {
              select: {
                academicYear: true,
                semester: true,
              },
            },
          },
        },
      },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!student.groupId) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak memiliki groupId' },
        { status: 404 }
      );
    }

    const isMembimbing = await prisma.group.findFirst({
      where: {
        teacherId: teacher.userId,
        id: student.groupId,
      },
    });

    if (!isMembimbing) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak membimbing siswa ini' },
        { status: 403 }
      );
    }

    const targets = await prisma.weeklyTarget.findMany({
      where: {
        teacherId: teacher.userId,
        studentId: studentId,
        groupId: student.groupId,
      },
      orderBy: { startDate: 'desc' },
      include: {
        surahStart: { select: { id: true, name: true, verseCount: true } },
        surahEnd: { select: { id: true, name: true, verseCount: true } },
        wafa: { select: { id: true, name: true, pageCount: true } },
      },
    });

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          groupId: student.groupId,
          academicYear: student.group?.classroom?.academicYear,
          semester: student.group?.classroom?.semester,
          totalTargets: 0,
        },
      });
    }

    // Ambil semua setoran siswa dalam rentang semua target
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        groupId: student.groupId,
        date: {
          gte: targets.at(-1)?.startDate,
          lte: targets[0]?.endDate,
        },
      },
    });

    // Hitung progress persentase per target
    const withProgress = targets.map((target) => {
      const {
        startDate,
        endDate,
        type,
        surahStartId,
        surahEndId,
        startAyat,
        endAyat,
        wafaId,
        startPage,
        endPage,
      } = target;

      const relevantSubmissions = submissions.filter(
        (s) => s.date >= startDate && s.date <= endDate && s.submissionType === type
      );

      let required = 0;
      let achieved = 0;

      if (type === 'TAHFIDZ' && surahStartId && surahEndId && startAyat && endAyat) {
        const ayats = [];
        for (let surahId = surahStartId; surahId <= surahEndId; surahId++) {
          const verseCount =
            surahId === surahStartId
              ? target.surahStart?.verseCount ?? 0
              : surahId === surahEndId
              ? target.surahEnd?.verseCount ?? 0
              : 0;
          const from = surahId === surahStartId ? startAyat : 1;
          const to = surahId === surahEndId ? endAyat : verseCount;

          for (let i = from; i <= to; i++) {
            ayats.push(`${surahId}:${i}`);
          }
        }
        required = ayats.length;

        const submitted = new Set<string>();
        for (const s of relevantSubmissions) {
          if (!s.surahId || !s.startVerse || !s.endVerse) continue;
          for (let i = s.startVerse; i <= s.endVerse; i++) {
            submitted.add(`${s.surahId}:${i}`);
          }
        }

        achieved = ayats.filter((a) => submitted.has(a)).length;
      }

      if (type === 'TAHSIN_WAFA' && wafaId && startPage && endPage) {
        required = endPage - startPage + 1;
        const submitted = new Set<number>();
        for (const s of relevantSubmissions) {
          if (s.wafaId === wafaId && s.startPage && s.endPage) {
            for (let i = s.startPage; i <= s.endPage; i++) {
              submitted.add(i);
            }
          }
        }
        achieved = Array.from({ length: required }, (_, i) => startPage + i).filter((p) =>
          submitted.has(p)
        ).length;
      }

      const progressPercent = required === 0 ? 0 : Math.floor((achieved / required) * 100);

      return {
        ...target,
        progressPercent,
      };
    });

    return NextResponse.json({
      success: true,
      data: withProgress,
      meta: {
        groupId: student.groupId,
        academicYear: student.group?.classroom?.academicYear,
        semester: student.group?.classroom?.semester,
        totalTargets: withProgress.length,
      },
    });
  } catch (error) {
    console.error('[GET_WEEKLY_TARGET_STUDENT]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data target siswa' },
      { status: 500 }
    );
  }
}
