import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma, SubmissionType, Adab, SubmissionStatus, Role } from '@prisma/client';
import { evaluateTargetAchievement } from '@/lib/data/teacher/evaluate-target';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segment: { params: Params }) {
  try {
    const { id } = await segment.params;
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

    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
      select: { teacherId: true, studentId: true, date: true },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { success: false, message: 'Setoran tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingSubmission.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, message: 'Setoran bukan milik Anda' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      submissionType: SubmissionType;
      juzId?: number;
      surahId?: number;
      startVerse?: number;
      endVerse?: number;
      wafaId?: number;
      startPage?: number;
      endPage?: number;
      adab: Adab;
      submissionStatus: SubmissionStatus;
      note?: string;
    };

    const {
      submissionType,
      juzId,
      surahId,
      startVerse,
      endVerse,
      wafaId,
      startPage,
      endPage,
      adab,
      submissionStatus,
      note,
    } = body;

    const dataToUpdate: Prisma.SubmissionUpdateInput = {
      submissionType,
      submissionStatus,
      adab,
      note,
      juz: juzId ? { connect: { id: juzId } } : { disconnect: true },
      surah: { disconnect: true },
      startVerse: null,
      endVerse: null,
      wafa: { disconnect: true },
      startPage: null,
      endPage: null,
    };

    if (submissionType === 'TAHFIDZ' || submissionType === 'TAHSIN_ALQURAN') {
      if (surahId) {
        const surah = await prisma.surah.findUnique({ where: { id: surahId } });
        if (!surah) {
          return NextResponse.json(
            { success: false, message: 'Surah tidak ditemukan' },
            { status: 400 }
          );
        }
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
        dataToUpdate.surah = { connect: { id: surahId } };
        dataToUpdate.startVerse = startVerse ?? null;
        dataToUpdate.endVerse = endVerse ?? null;
      }
    }

    if (submissionType === 'TAHSIN_WAFA') {
      if (wafaId) {
        const wafa = await prisma.wafa.findUnique({ where: { id: wafaId } });
        if (!wafa) {
          return NextResponse.json(
            { success: false, message: 'Materi Wafa tidak ditemukan' },
            { status: 400 }
          );
        }
        if (startPage !== undefined && endPage !== undefined && startPage > endPage) {
          return NextResponse.json(
            {
              success: false,
              message: 'Halaman mulai tidak boleh lebih besar dari halaman selesai',
            },
            { status: 400 }
          );
        }
        dataToUpdate.wafa = { connect: { id: wafaId } };
        dataToUpdate.startPage = startPage ?? null;
        dataToUpdate.endPage = endPage ?? null;
      }
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: dataToUpdate,
    });

    await evaluateTargetAchievement(updated.studentId, updated.date, updated.date);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[SUBMISSION_PUT]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui setoran' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segment: { params: Params }) {
  try {
    const params = await segment.params;
    const id = params.id;

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

    const submission = await prisma.submission.findUnique({
      where: { id },
      select: { teacherId: true, studentId: true, date: true },
    });
    if (!submission) {
      return NextResponse.json(
        { success: false, message: 'Setoran tidak ditemukan' },
        { status: 404 }
      );
    }

    if (submission.teacherId !== teacher.id) {
      return NextResponse.json(
        { success: false, message: 'Setoran bukan milik Anda' },
        { status: 403 }
      );
    }

    await prisma.submission.delete({ where: { id } });

    await evaluateTargetAchievement(submission.studentId, submission.date, submission.date);

    return NextResponse.json({ success: true, message: 'Setoran berhasil dihapus' });
  } catch (error) {
    console.error('[SUBMISSION_DELETE]', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus setoran' },
      { status: 500 }
    );
  }
}
