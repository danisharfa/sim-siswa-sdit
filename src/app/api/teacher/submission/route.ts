import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { evaluateTargetAchievement } from '@/lib/data/teacher/evaluate-target';
import { Role } from '@prisma/client';

export async function GET() {
  try {
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

    const kelompokBinaan = await prisma.teacherGroup.findMany({
      where: { teacherId: teacher.id },
      select: { groupId: true },
    });

    const groupIds = kelompokBinaan.map((item) => item.groupId);

    const submissionList = await prisma.submission.findMany({
      where: {
        teacherId: teacher.id,
        groupId: {
          in: groupIds,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        surah: { select: { id: true, name: true } },
        juz: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
        student: {
          select: {
            nis: true,
            user: { select: { fullName: true } },
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            classroom: {
              select: { name: true, academicYear: true, semester: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data setoran berhasil diambil',
      data: submissionList,
    });
  } catch (error) {
    console.error('[SUBMISSION_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data setoran',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const {
      date,
      groupId,
      studentId,
      submissionType,
      submissionStatus,
      adab,
      note,
      juzId,
      surahId,
      startVerse,
      endVerse,
      wafaId,
      startPage,
      endPage,
    } = await req.json();

    if (!groupId || !studentId || !submissionType) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
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

    const isGuruMembimbing = await prisma.teacherGroup.findFirst({
      where: {
        teacherId: teacher.id,
        groupId,
      },
    });
    if (!isGuruMembimbing) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak membimbing kelompok ini' },
        { status: 403 }
      );
    }

    const student = await prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        groupId,
      },
      include: {
        classroom: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak berada di kelompok ini' },
        { status: 400 }
      );
    }

    if (!student.classroom) {
      return NextResponse.json(
        { success: false, message: 'Siswa belum terdaftar di kelas aktif' },
        { status: 400 }
      );
    }

    // Validasi referensi
    if (juzId) {
      const juz = await prisma.juz.findUnique({ where: { id: juzId } });
      if (!juz) {
        return NextResponse.json(
          { success: false, message: 'Juz tidak ditemukan' },
          { status: 400 }
        );
      }
    }

    if (surahId) {
      const surah = await prisma.surah.findUnique({ where: { id: surahId } });
      if (!surah) {
        return NextResponse.json(
          { success: false, message: 'Surah tidak ditemukan' },
          { status: 400 }
        );
      }

      // Validasi ayat
      if (startVerse && startVerse < 1) {
        return NextResponse.json(
          { success: false, message: 'Ayat mulai tidak valid' },
          { status: 400 }
        );
      }
      if (endVerse && endVerse > surah.verseCount) {
        return NextResponse.json(
          {
            success: false,
            message: `Ayat selesai melebihi jumlah ayat surah (${surah.verseCount})`,
          },
          { status: 400 }
        );
      }
    }

    if (wafaId) {
      const wafa = await prisma.wafa.findUnique({ where: { id: wafaId } });
      if (!wafa) {
        return NextResponse.json(
          { success: false, message: 'Materi Wafa tidak ditemukan' },
          { status: 400 }
        );
      }

      // Validasi halaman
      if (startPage !== undefined && endPage !== undefined && startPage > endPage) {
        return NextResponse.json(
          { success: false, message: 'Halaman mulai tidak boleh lebih besar dari halaman selesai' },
          { status: 400 }
        );
      }
    }

    const submissionId = `SETORAN-${crypto.randomUUID()}`;

    const submission = await prisma.submission.create({
      data: {
        id: submissionId,
        studentId,
        teacherId: teacher.id,
        groupId,
        date: date ? new Date(date) : new Date(),
        academicYear: student.classroom.academicYear,
        semester: student.classroom.semester,
        submissionType,
        submissionStatus,
        adab,
        note,
        juzId,
        surahId,
        startVerse,
        endVerse,
        wafaId,
        startPage,
        endPage,
      },
    });

    await evaluateTargetAchievement(studentId, submission.date, submission.date);

    return NextResponse.json({ success: true, data: submission });
  } catch (error) {
    console.error('[SUBMISSION_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat menyimpan setoran' },
      { status: 500 }
    );
  }
}
