import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const { date, sessionName, startTime, endTime, location, studentsToRemove } = await req.json();
    if (!date || !sessionName || !startTime || !endTime || !location) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const existingSchedule = await prisma.tashihSchedule.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tashih tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingSchedule.results.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak dapat diedit karena sudah dinilai' },
        { status: 400 }
      );
    }

    const duplicateSchedule = await prisma.tashihSchedule.findFirst({
      where: {
        AND: [
          { date: new Date(date) },
          { sessionName },
          { startTime },
          { endTime },
          { location },
          { id: { not: id } },
        ],
      },
    });

    if (duplicateSchedule) {
      return NextResponse.json(
        {
          success: false,
          message: 'Jadwal dengan tanggal, sesi, waktu, dan lokasi yang sama sudah ada',
        },
        { status: 409 }
      );
    }

    // Update jadwal dan hapus siswa yang dipilih dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      // Update jadwal tashih
      await tx.tashihSchedule.update({
        where: { id },
        data: {
          date: new Date(date),
          sessionName,
          startTime,
          endTime,
          location,
        },
      });

      // Hapus siswa yang dipilih dari jadwal (berdasarkan requestId)
      if (studentsToRemove && Array.isArray(studentsToRemove) && studentsToRemove.length > 0) {
        // Hapus satu per satu menggunakan composite key
        for (const requestId of studentsToRemove) {
          await tx.tashihScheduleRequest.delete({
            where: {
              scheduleId_requestId: {
                scheduleId: id,
                requestId: requestId,
              },
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal Tashih berhasil diperbarui',
    });
  } catch (error) {
    console.error('Gagal memperbarui Jadwal Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui Jadwal Tashih' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await segmentData.params;

    const existingSchedule = await prisma.tashihSchedule.findUnique({
      where: { id },
      include: {
        results: true,
        schedules: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tashih tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingSchedule.results.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak dapat dihapus karena sudah dinilai' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tashihScheduleRequest.deleteMany({
        where: { scheduleId: id },
      });

      await tx.tashihSchedule.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Jadwal Tashih berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus Jadwal Tashih:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus Jadwal Tashih' },
      { status: 500 }
    );
  }
}
