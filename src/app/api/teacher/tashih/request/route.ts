// /api/teacher/tashih/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }

    const { studentId, tashihType, juzId, surahId, wafaId, startPage, endPage, notes } =
      await req.json();

    if (!studentId || !tashihType) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    // validasi berdasarkan jenis
    if (tashihType === 'ALQURAN') {
      if (!juzId || !surahId) {
        return NextResponse.json(
          { success: false, message: 'Juz dan Surah wajib diisi' },
          { status: 400 }
        );
      }
    } else if (tashihType === 'WAFA') {
      if (!wafaId || startPage == null) {
        return NextResponse.json(
          { success: false, message: 'Wafa dan halaman mulai wajib diisi' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Jenis tashih tidak valid' },
        { status: 400 }
      );
    }

    // cek duplikat
    const existing = await prisma.tashihRequest.findFirst({
      where: {
        studentId,
        tashihType,
        status: 'MENUNGGU',
        ...(tashihType === 'ALQURAN' && { juzId, surahId }),
        ...(tashihType === 'WAFA' && { wafaId, startPage, endPage: endPage ?? startPage }),
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Permintaan tashih sudah ada dan masih menunggu.',
        },
        { status: 400 }
      );
    }

    const newRequest = await prisma.tashihRequest.create({
      data: {
        teacherId: teacher.id,
        studentId,
        tashihType,
        juzId: tashihType === 'ALQURAN' ? juzId : null,
        surahId: tashihType === 'ALQURAN' ? surahId : null,
        wafaId: tashihType === 'WAFA' ? wafaId : null,
        startPage: tashihType === 'WAFA' ? startPage : null,
        endPage: tashihType === 'WAFA' ? endPage ?? startPage : null,
        notes: notes ?? null,
        status: 'MENUNGGU',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Berhasil mendaftarkan permintaan tashih',
      data: newRequest,
    });
  } catch (error) {
    console.error('[TASHIH_REQUEST_POST]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mendaftarkan permintaan tashih' },
      { status: 500 }
    );
  }
}
