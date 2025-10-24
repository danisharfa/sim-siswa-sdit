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

    const { date, sessionName, startTime, endTime, location, examinerId } = await req.json();
    if (!date || !sessionName || !startTime || !endTime || !location) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const existingSchedule = await prisma.munaqasyahSchedule.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal munaqasyah tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingSchedule.results.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak dapat diedit karena sudah dinilai' },
        { status: 400 }
      );
    }

    // Check for duplicate schedule (excluding current one)
    const duplicateSchedule = await prisma.munaqasyahSchedule.findFirst({
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

    const updateData: {
      date: Date;
      sessionName: string;
      startTime: string;
      endTime: string;
      location: string;
      examinerId?: string | null;
    } = {
      date: new Date(date),
      sessionName,
      startTime,
      endTime,
      location,
    };

    // Update examiner (can be null for coordinator)
    if (examinerId !== undefined) {
      updateData.examinerId = examinerId;
    }

    const updatedSchedule = await prisma.munaqasyahSchedule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal Munaqasyah berhasil diperbarui',
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Gagal memperbarui Jadwal Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui Jadwal Munaqasyah' },
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

    const existingSchedule = await prisma.munaqasyahSchedule.findUnique({
      where: { id },
      include: {
        results: true,
        scheduleRequests: true,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, message: 'Jadwal munaqasyah tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingSchedule.results.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Jadwal tidak dapat dihapus karena sudah dinilai' },
        { status: 400 }
      );
    }

    // Use transaction to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete related schedule requests first
      await tx.munaqasyahScheduleRequest.deleteMany({
        where: { scheduleId: id },
      });

      // Then delete the schedule
      await tx.munaqasyahSchedule.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Jadwal Munaqasyah berhasil dihapus' });
  } catch (error) {
    console.error('Gagal menghapus Jadwal Munaqasyah:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus Jadwal Munaqasyah' },
      { status: 500 }
    );
  }
}
