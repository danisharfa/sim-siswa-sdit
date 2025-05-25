import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role, StudentStatus } from '@prisma/client';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const classroomId = params.id;

    if (!classroomId) {
      return NextResponse.json(
        { success: false, message: 'classroomId is required' },
        { status: 400 }
      );
    }

    const studentList = await prisma.studentProfile.findMany({
      where: { classroomId },
      orderBy: { nis: 'asc' },
      select: {
        id: true,
        nis: true,
        user: {
          select: { fullName: true },
        },
      },
    });

    const formattedSiswa = studentList.map((siswa) => ({
      id: siswa.id,
      nis: siswa.nis,
      fullName: siswa.user.fullName,
    }));

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil diambil',
      data: formattedSiswa,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const classroomId = params.id;

    const body = await req.json();
    const { nis, nisList } = body;

    if (!classroomId) {
      return NextResponse.json(
        { success: false, message: 'classroomId wajib diisi' },
        { status: 400 }
      );
    }

    if (Array.isArray(nisList)) {
      // 🔁 Tambah banyak siswa sekaligus
      const updated = await prisma.studentProfile.updateMany({
        where: {
          nis: { in: nisList },
          classroomId: null,
          status: StudentStatus.AKTIF,
        },
        data: { classroomId },
      });

      return NextResponse.json({
        success: true,
        message: `${updated.count} siswa berhasil ditambahkan ke kelas`,
      });
    }

    if (!nis) {
      return NextResponse.json(
        { success: false, message: 'NIS wajib diisi jika bukan bulk' },
        { status: 400 }
      );
    }

    // ➕ Tambah satu siswa
    const siswa = await prisma.studentProfile.findUnique({
      where: { nis },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    if (siswa.classroomId) {
      return NextResponse.json(
        { success: false, message: 'Siswa sudah dalam kelas lain' },
        { status: 409 }
      );
    }

    await prisma.studentProfile.update({
      where: { id: siswa.id },
      data: { classroomId },
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan ke kelas',
    });
  } catch (error) {
    console.error('POST /member error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, segmentData: { params: Params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const params = await segmentData.params;
    const classroomId = params.id;

    const { nis } = await req.json();

    if (!nis || !classroomId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data tidak lengkap. Pastikan NIS dan classroomId diisi.',
          data: null,
        },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { nis },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Siswa dengan NIS tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    if (student.classroomId !== classroomId) {
      return NextResponse.json(
        { success: false, message: 'Siswa tidak terdaftar di kelas ini' },
        { status: 409 }
      );
    }

    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { classroomId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus dari kelas',
      data: null,
    });
  } catch (error) {
    console.error('DELETE /remove-member error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
