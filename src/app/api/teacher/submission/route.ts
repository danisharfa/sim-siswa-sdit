import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { evaluateTargetAchievement } from '@/lib/data/teacher/evaluate-target';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    const teacherGroups = await prisma.group.findMany({
      where: { teacherId: teacher.userId },
      select: { id: true },
    });

    const groupIds = teacherGroups.map((item) => item.id);

    if (groupIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Belum ada kelompok bimbingan Anda',
        data: [],
      });
    }

    const data = await prisma.submission.findMany({
      where: {
        teacherId: teacher.userId,
        groupId: {
          in: groupIds,
        },
      },
      orderBy: { date: 'desc' },
      include: {
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
              select: {
                name: true,
                academicYear: true,
                semester: true,
              },
            },
          },
        },
        surah: { select: { id: true, name: true } },
        juz: { select: { id: true, name: true } },
        wafa: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Daftar Setoran berhasil diambil',
      data,
    });
  } catch (error) {
    console.error('Gagal mengambil daftar Setoran:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar Setoran' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.teacher) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    // ===== BASIC VALIDATION =====
    if (!date || !groupId || !studentId || !submissionType || !submissionStatus || !adab) {
      return NextResponse.json(
        { success: false, message: 'Data dasar tidak lengkap' },
        { status: 400 }
      );
    }

    // ===== CONDITIONAL VALIDATION BASED ON SUBMISSION TYPE =====
    if (submissionType === 'TAHFIDZ' || submissionType === 'TAHSIN_ALQURAN') {
      if (!juzId) {
        return NextResponse.json(
          { success: false, message: "Juz harus diisi untuk Tahfidz/Tahsin Al-Qur'an" },
          { status: 400 }
        );
      }
      if (!surahId) {
        return NextResponse.json(
          { success: false, message: "Surah harus diisi untuk Tahfidz/Tahsin Al-Qur'an" },
          { status: 400 }
        );
      }
      if (!startVerse || !endVerse) {
        return NextResponse.json(
          {
            success: false,
            message: "Ayat mulai dan selesai harus diisi untuk Tahfidz/Tahsin Al-Qur'an",
          },
          { status: 400 }
        );
      }
      if (startVerse > endVerse) {
        return NextResponse.json(
          { success: false, message: 'Ayat mulai tidak boleh lebih besar dari ayat selesai' },
          { status: 400 }
        );
      }
    }

    if (submissionType === 'TAHSIN_WAFA') {
      if (!wafaId) {
        return NextResponse.json(
          { success: false, message: 'Materi Wafa harus diisi untuk Tahsin Wafa' },
          { status: 400 }
        );
      }
      if (!startPage || !endPage) {
        return NextResponse.json(
          { success: false, message: 'Halaman mulai dan selesai harus diisi untuk Tahsin Wafa' },
          { status: 400 }
        );
      }
      if (startPage > endPage) {
        return NextResponse.json(
          { success: false, message: 'Halaman mulai tidak boleh lebih besar dari halaman selesai' },
          { status: 400 }
        );
      }
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

    const isGuruMembimbing = await prisma.group.findFirst({
      where: {
        teacherId: teacher.userId,
        id: groupId,
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
        userId: studentId,
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

    const data = await prisma.submission.create({
      data: {
        id: submissionId,
        studentId,
        teacherId: teacher.userId,
        groupId,
        date: date ? new Date(date) : new Date(),
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

    await evaluateTargetAchievement(studentId, data.date, data.date);

    return NextResponse.json({
      success: true,
      message: 'Setoran berhasil disimpan',
      data,
    });
  } catch (error) {
    console.error('Gagal menyimpan Setoran:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan Setoran' }, { status: 500 });
  }
}
